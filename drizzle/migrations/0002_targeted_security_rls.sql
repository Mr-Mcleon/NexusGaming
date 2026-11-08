-- Restrict profile reads to the existing authenticated-only SELECT policy.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Correlate participant membership to the conversation being deleted.
DROP POLICY IF EXISTS "Participants can delete conversations" ON public.conversations;
CREATE POLICY "Participants can delete conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);

-- Only the recipient may update a friendship; retain the validation trigger.
DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
CREATE POLICY "Users can update their friendships"
ON public.friendships
FOR UPDATE
TO authenticated
USING (friend_id = auth.uid())
WITH CHECK (friend_id = auth.uid());

-- Sale alerts are inserted by the existing SECURITY DEFINER trigger.
-- Leave authenticated SELECT and column-level UPDATE(read) grants unchanged.
REVOKE INSERT, REFERENCES ON TABLE public.sale_notifications FROM anon;
REVOKE INSERT ON TABLE public.sale_notifications FROM authenticated;