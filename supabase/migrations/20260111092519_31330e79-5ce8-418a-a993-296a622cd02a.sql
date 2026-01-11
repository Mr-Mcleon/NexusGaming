-- Add sale_price column to games table
ALTER TABLE public.games 
ADD COLUMN sale_price numeric DEFAULT NULL;

-- Create sale_notifications table
CREATE TABLE public.sale_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  original_price numeric NOT NULL,
  sale_price numeric NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sale_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own sale notifications"
ON public.sale_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own sale notifications"
ON public.sale_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own sale notifications"
ON public.sale_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert sale notifications"
ON public.sale_notifications
FOR INSERT
WITH CHECK (true);

-- Function to create sale notifications for wishlist users
CREATE OR REPLACE FUNCTION public.notify_wishlist_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when sale_price is set and is lower than price
  IF NEW.sale_price IS NOT NULL AND NEW.sale_price < NEW.price AND 
     (OLD.sale_price IS NULL OR OLD.sale_price != NEW.sale_price) THEN
    
    -- Insert notification for each user who has this game wishlisted
    INSERT INTO public.sale_notifications (user_id, game_id, original_price, sale_price)
    SELECT w.user_id, NEW.id, NEW.price, NEW.sale_price
    FROM public.wishlist w
    WHERE w.game_id = NEW.id
    ON CONFLICT DO NOTHING;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for game updates
CREATE TRIGGER on_game_sale
AFTER UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.notify_wishlist_on_sale();

-- Add unique constraint to prevent duplicate notifications
ALTER TABLE public.sale_notifications 
ADD CONSTRAINT unique_sale_notification UNIQUE (user_id, game_id, sale_price);

-- Enable realtime for sale notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_notifications;