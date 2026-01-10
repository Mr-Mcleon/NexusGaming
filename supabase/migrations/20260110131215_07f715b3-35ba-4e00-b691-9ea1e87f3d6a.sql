-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist"
ON public.wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist"
ON public.wishlist FOR DELETE
USING (auth.uid() = user_id);