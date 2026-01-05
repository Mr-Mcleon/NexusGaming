-- Add currently playing game tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN currently_playing_game_id uuid REFERENCES public.games(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_currently_playing ON public.profiles(currently_playing_game_id) WHERE currently_playing_game_id IS NOT NULL;