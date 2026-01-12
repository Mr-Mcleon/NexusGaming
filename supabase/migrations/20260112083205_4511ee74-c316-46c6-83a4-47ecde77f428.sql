-- Add email notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sale_email_notifications boolean NOT NULL DEFAULT true;

-- Update the trigger function to check email preferences before sending
CREATE OR REPLACE FUNCTION public.notify_wishlist_on_sale()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  wishlist_record RECORD;
  user_wants_email BOOLEAN;
  edge_function_url TEXT;
BEGIN
  -- Only trigger when sale_price is set and is lower than price
  IF NEW.sale_price IS NOT NULL AND NEW.sale_price < NEW.price AND 
     (OLD.sale_price IS NULL OR OLD.sale_price != NEW.sale_price) THEN
    
    edge_function_url := 'https://qvnkjxhgqhfktilzeawr.supabase.co/functions/v1/send-sale-notification-email';
    
    -- Insert notification for each user who has this game wishlisted
    FOR wishlist_record IN 
      SELECT w.user_id, COALESCE(p.sale_email_notifications, true) as wants_email
      FROM public.wishlist w
      LEFT JOIN public.profiles p ON p.user_id = w.user_id
      WHERE w.game_id = NEW.id
    LOOP
      -- Insert the in-app notification (always)
      INSERT INTO public.sale_notifications (user_id, game_id, original_price, sale_price)
      VALUES (wishlist_record.user_id, NEW.id, NEW.price, NEW.sale_price)
      ON CONFLICT DO NOTHING;
      
      -- Only send email if user has opted in
      IF wishlist_record.wants_email THEN
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
      END IF;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$function$;