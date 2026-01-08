-- Create achievements table for badge definitions
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table for tracking unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are viewable by everyone
CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements FOR SELECT
USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Users can unlock achievements for themselves
CREATE POLICY "Users can unlock achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Steps', 'Add your first game to your library', 'gamepad-2', 'games_owned', 1),
('Collector', 'Own 5 games in your library', 'library', 'games_owned', 5),
('Hoarder', 'Own 10 games in your library', 'archive', 'games_owned', 10),
('Getting Started', 'Play games for 60 minutes total', 'clock', 'total_playtime', 60),
('Dedicated Gamer', 'Play games for 10 hours total', 'timer', 'total_playtime', 600),
('No Life', 'Play games for 100 hours total', 'flame', 'total_playtime', 6000),
('Social Butterfly', 'Add your first friend', 'users', 'friends_count', 1),
('Popular', 'Have 5 friends', 'heart', 'friends_count', 5),
('Critic', 'Write your first game review', 'star', 'reviews_written', 1),
('Reviewer', 'Write 5 game reviews', 'message-square', 'reviews_written', 5);