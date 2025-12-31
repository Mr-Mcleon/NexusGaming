-- Create games table (catalog of all available games)
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  developer TEXT,
  publisher TEXT,
  release_date DATE,
  genres TEXT[],
  tags TEXT[],
  price DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on games (readable by all, editable by admins later)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Everyone can view games
CREATE POLICY "Games are viewable by everyone" 
ON public.games 
FOR SELECT 
USING (true);

-- Create user_library table (user's owned/added games)
CREATE TABLE public.user_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  play_time_minutes INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  installed BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS on user_library
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- Users can view their own library
CREATE POLICY "Users can view their own library" 
ON public.user_library 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can add games to their library
CREATE POLICY "Users can add games to their library" 
ON public.user_library 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own library entries
CREATE POLICY "Users can update their own library" 
ON public.user_library 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can remove games from their library
CREATE POLICY "Users can delete from their own library" 
ON public.user_library 
FOR DELETE 
USING (auth.uid() = user_id);

-- Insert some sample games
INSERT INTO public.games (title, description, cover_image_url, developer, publisher, genres, tags, price, rating) VALUES
('Cyber Odyssey 2077', 'An open-world action RPG set in a dystopian future', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', 'CD Projekt Red', 'CD Projekt', ARRAY['RPG', 'Action', 'Open World'], ARRAY['cyberpunk', 'futuristic', 'story-rich'], 59.99, 4.2),
('Stellar Warfare', 'Epic space battles across the galaxy', 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', 'Stellar Games', 'Galaxy Publishing', ARRAY['Strategy', 'Sci-Fi'], ARRAY['space', 'multiplayer', 'competitive'], 39.99, 4.5),
('Shadow Legends', 'Dark fantasy action with legendary heroes', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', 'Dark Arts Studio', 'Legend Games', ARRAY['Action', 'Fantasy', 'RPG'], ARRAY['dark-fantasy', 'combat', 'loot'], 49.99, 4.7),
('Racing Thunder', 'High-speed racing across stunning tracks', 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400', 'Speed Studios', 'Turbo Games', ARRAY['Racing', 'Sports'], ARRAY['cars', 'multiplayer', 'arcade'], 29.99, 4.3),
('Pixel Warriors', 'Retro-style adventure with modern gameplay', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', 'Indie Pixel', 'Retro Publishing', ARRAY['Indie', 'Adventure', 'Platformer'], ARRAY['pixel-art', 'retro', 'casual'], 14.99, 4.8),
('Battle Royale Arena', 'Last player standing in intense combat', 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0d?w=400', 'Arena Games', 'Combat Studios', ARRAY['Shooter', 'Battle Royale'], ARRAY['competitive', 'multiplayer', 'action'], 0, 4.1),
('Mystery Manor', 'Solve puzzles in a haunted Victorian mansion', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', 'Puzzle Masters', 'Mystery Games', ARRAY['Puzzle', 'Horror', 'Adventure'], ARRAY['mystery', 'atmospheric', 'story'], 24.99, 4.6),
('World Builder Craft', 'Create and explore infinite worlds', 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400', 'Sandbox Studios', 'Creative Games', ARRAY['Sandbox', 'Survival', 'Creative'], ARRAY['building', 'crafting', 'multiplayer'], 19.99, 4.9);