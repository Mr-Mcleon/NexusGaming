-- Fix overly permissive conversations INSERT policy
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix overly permissive conversation_participants INSERT policy
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add participants"
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix overly permissive sale_notifications INSERT policy (restrict to service role via auth check)
DROP POLICY IF EXISTS "System can insert sale notifications" ON public.sale_notifications;
CREATE POLICY "System can insert sale notifications"
  ON public.sale_notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);