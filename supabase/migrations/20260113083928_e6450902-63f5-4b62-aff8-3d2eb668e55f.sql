-- Create table for wishlist price alerts
CREATE TABLE public.wishlist_price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  target_price NUMERIC NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_price_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own price alerts"
ON public.wishlist_price_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts"
ON public.wishlist_price_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
ON public.wishlist_price_alerts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
ON public.wishlist_price_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Update the notify_wishlist_on_sale function to also check price alerts
CREATE OR REPLACE FUNCTION public.notify_wishlist_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  wishlist_record RECORD;
  alert_record RECORD;
  user_wants_email BOOLEAN;
  edge_function_url TEXT;
  current_price NUMERIC;
BEGIN
  -- Determine the current effective price
  current_price := COALESCE(NEW.sale_price, NEW.price);
  
  -- Check for sale notifications (existing logic)
  IF NEW.sale_price IS NOT NULL AND NEW.sale_price < NEW.price AND 
     (OLD.sale_price IS NULL OR OLD.sale_price != NEW.sale_price) THEN
    
    edge_function_url := 'https://qvnkjxhgqhfktilzeawr.supabase.co/functions/v1/send-sale-notification-email';
    
    FOR wishlist_record IN 
      SELECT w.user_id, COALESCE(p.sale_email_notifications, true) as wants_email
      FROM public.wishlist w
      LEFT JOIN public.profiles p ON p.user_id = w.user_id
      WHERE w.game_id = NEW.id
    LOOP
      INSERT INTO public.sale_notifications (user_id, game_id, original_price, sale_price)
      VALUES (wishlist_record.user_id, NEW.id, NEW.price, NEW.sale_price)
      ON CONFLICT DO NOTHING;
      
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
  
  -- Check for price drop alerts
  IF current_price IS NOT NULL AND (OLD.price != NEW.price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price) THEN
    FOR alert_record IN
      SELECT pa.id, pa.user_id, pa.target_price, COALESCE(p.sale_email_notifications, true) as wants_email
      FROM public.wishlist_price_alerts pa
      LEFT JOIN public.profiles p ON p.user_id = pa.user_id
      WHERE pa.game_id = NEW.id
        AND pa.notified = false
        AND current_price <= pa.target_price
    LOOP
      -- Insert notification
      INSERT INTO public.sale_notifications (user_id, game_id, original_price, sale_price)
      VALUES (alert_record.user_id, NEW.id, NEW.price, current_price)
      ON CONFLICT DO NOTHING;
      
      -- Mark alert as notified
      UPDATE public.wishlist_price_alerts
      SET notified = true
      WHERE id = alert_record.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;