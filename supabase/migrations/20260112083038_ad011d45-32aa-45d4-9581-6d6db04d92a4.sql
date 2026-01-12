-- Enable the pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update the trigger function to also send email notifications
CREATE OR REPLACE FUNCTION public.notify_wishlist_on_sale()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  wishlist_record RECORD;
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only trigger when sale_price is set and is lower than price
  IF NEW.sale_price IS NOT NULL AND NEW.sale_price < NEW.price AND 
     (OLD.sale_price IS NULL OR OLD.sale_price != NEW.sale_price) THEN
    
    -- Get the edge function URL from vault or use environment
    edge_function_url := 'https://qvnkjxhgqhfktilzeawr.supabase.co/functions/v1/send-sale-notification-email';
    
    -- Insert notification for each user who has this game wishlisted
    FOR wishlist_record IN 
      SELECT w.user_id
      FROM public.wishlist w
      WHERE w.game_id = NEW.id
    LOOP
      -- Insert the in-app notification
      INSERT INTO public.sale_notifications (user_id, game_id, original_price, sale_price)
      VALUES (wishlist_record.user_id, NEW.id, NEW.price, NEW.sale_price)
      ON CONFLICT DO NOTHING;
      
      -- Call edge function to send email (fire and forget)
      PERFORM extensions.http_post(
        url := edge_function_url,
        body := jsonb_build_object(
          'user_id', wishlist_record.user_id,
          'game_id', NEW.id,
          'game_title', NEW.title,
          'original_price', NEW.price,
          'sale_price', NEW.sale_price
        )::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        )
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$function$;