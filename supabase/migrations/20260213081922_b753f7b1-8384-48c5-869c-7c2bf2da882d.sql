
-- 1. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. Restrict game_reviews SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.game_reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.game_reviews;
CREATE POLICY "Reviews viewable by authenticated users"
  ON public.game_reviews FOR SELECT
  TO authenticated
  USING (true);

-- 3. Add DELETE policy for profiles (GDPR)
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add DELETE policy for conversations (participants can delete)
CREATE POLICY "Participants can delete conversations"
  ON public.conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
  );

-- 5. Add DELETE policy for conversation_participants (leave conversations)
CREATE POLICY "Users can leave conversations"
  ON public.conversation_participants FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Add DELETE policy for messages (delete own messages)
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);
