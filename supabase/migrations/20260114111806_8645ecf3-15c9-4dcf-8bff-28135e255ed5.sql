-- Create table for shareable wishlist links
CREATE TABLE public.wishlist_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on user_id (one share per user)
CREATE UNIQUE INDEX idx_wishlist_shares_user_id ON public.wishlist_shares(user_id);

-- Create index on share_token for fast lookups
CREATE INDEX idx_wishlist_shares_token ON public.wishlist_shares(share_token);

-- Enable RLS
ALTER TABLE public.wishlist_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own shares
CREATE POLICY "Users can view their own wishlist shares"
ON public.wishlist_shares
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own shares
CREATE POLICY "Users can create their own wishlist shares"
ON public.wishlist_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shares
CREATE POLICY "Users can update their own wishlist shares"
ON public.wishlist_shares
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete their own wishlist shares"
ON public.wishlist_shares
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_wishlist_shares_updated_at
BEFORE UPDATE ON public.wishlist_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to get shared wishlist (public access by token)
CREATE OR REPLACE FUNCTION public.get_shared_wishlist(p_token TEXT)
RETURNS TABLE (
  id UUID,
  added_at TIMESTAMPTZ,
  game_id UUID,
  game_title TEXT,
  game_description TEXT,
  game_cover_image_url TEXT,
  game_price NUMERIC,
  game_sale_price NUMERIC,
  game_rating NUMERIC,
  game_genres TEXT[],
  owner_username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_record RECORD;
BEGIN
  -- Get the share record
  SELECT ws.user_id, ws.is_active
  INTO v_share_record
  FROM wishlist_shares ws
  WHERE ws.share_token = p_token;
  
  -- Check if share exists and is active
  IF NOT FOUND OR NOT v_share_record.is_active THEN
    RETURN;
  END IF;
  
  -- Return the wishlist with game details
  RETURN QUERY
  SELECT 
    w.id,
    w.added_at,
    w.game_id,
    g.title AS game_title,
    g.description AS game_description,
    g.cover_image_url AS game_cover_image_url,
    g.price AS game_price,
    g.sale_price AS game_sale_price,
    g.rating AS game_rating,
    g.genres AS game_genres,
    COALESCE(p.username, 'Anonymous') AS owner_username
  FROM wishlist w
  JOIN games g ON g.id = w.game_id
  LEFT JOIN profiles p ON p.user_id = w.user_id
  WHERE w.user_id = v_share_record.user_id
  ORDER BY w.added_at DESC;
END;
$$;