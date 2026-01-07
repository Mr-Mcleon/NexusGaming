-- Create activity_feed table
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('game_started', 'game_stopped', 'game_purchased', 'achievement_unlocked', 'friend_added')),
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can view activities from their friends
CREATE POLICY "Users can view friend activities"
ON public.activity_feed
FOR SELECT
USING (
  user_id IN (
    SELECT CASE 
      WHEN f.user_id = auth.uid() THEN f.friend_id 
      ELSE f.user_id 
    END
    FROM friendships f
    WHERE (f.user_id = auth.uid() OR f.friend_id = auth.uid())
    AND f.status = 'accepted'
  )
  OR user_id = auth.uid()
);

-- Users can create their own activities
CREATE POLICY "Users can create their own activities"
ON public.activity_feed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
ON public.activity_feed
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;