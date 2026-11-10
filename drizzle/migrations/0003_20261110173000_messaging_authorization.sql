-- Messaging authorization only; preserves existing rows and unrelated policies.
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants FOR SELECT TO authenticated
USING (public.is_conversation_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id AND public.is_conversation_participant(conversation_id, auth.uid()))
WITH CHECK (auth.uid() = sender_id AND public.is_conversation_participant(conversation_id, auth.uid()));

-- No client message editing is needed; read receipts use mark_conversation_read.
REVOKE UPDATE ON TABLE public.messages FROM authenticated;

CREATE OR REPLACE FUNCTION public.enforce_message_identity_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'Message sender and conversation cannot be changed';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER enforce_message_identity_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_identity_update();

DROP POLICY IF EXISTS "Users can manage their typing indicators" ON public.typing_indicators;
CREATE POLICY "Users can manage their typing indicators"
ON public.typing_indicators FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_conversation_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their typing indicators" ON public.typing_indicators;
CREATE POLICY "Users can update their typing indicators"
ON public.typing_indicators FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.is_conversation_participant(conversation_id, auth.uid()))
WITH CHECK (auth.uid() = user_id AND public.is_conversation_participant(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _me uuid := auth.uid();
  _conv uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _other_user_id IS NULL OR _other_user_id = _me THEN RAISE EXCEPTION 'Invalid recipient'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _other_user_id) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  -- Both callers derive the same lock key regardless of the pair's order.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'nexus:direct-conversation:' || LEAST(_me, _other_user_id)::text
    || ':' || GREATEST(_me, _other_user_id)::text, 0));

  IF EXISTS (SELECT 1 FROM public.blocked_users
             WHERE (user_id = _me AND blocked_user_id = _other_user_id)
                OR (user_id = _other_user_id AND blocked_user_id = _me)) THEN
    RAISE EXCEPTION 'Cannot message this user';
  END IF;

  SELECT a.conversation_id INTO _conv
  FROM public.conversation_participants a
  JOIN public.conversation_participants b ON b.conversation_id = a.conversation_id
  WHERE a.user_id = _me AND b.user_id = _other_user_id
    AND (SELECT count(*) FROM public.conversation_participants cp
         WHERE cp.conversation_id = a.conversation_id) = 2
  ORDER BY a.conversation_id
  LIMIT 1;
  IF _conv IS NOT NULL THEN RETURN _conv; END IF;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO _conv;
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (_conv, _me), (_conv, _other_user_id);
  RETURN _conv;
END;
$function$;