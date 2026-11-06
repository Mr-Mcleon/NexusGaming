-- ===== P1: sale email hardening =====
ALTER TABLE public.sale_notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Only allow users to insert notifications for themselves (trigger runs as SECURITY DEFINER and bypasses RLS)
DROP POLICY IF EXISTS "System can insert sale notifications" ON public.sale_notifications;
CREATE POLICY "System can insert sale notifications"
  ON public.sale_notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Atomically claim a notification for emailing (one email per notification, recent only)
CREATE OR REPLACE FUNCTION public.claim_sale_notification_email(_notification_id uuid)
RETURNS TABLE(user_id uuid, game_title text, original_price numeric, sale_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.sale_notifications sn
     SET email_sent_at = now()
    FROM public.games g
   WHERE sn.id = _notification_id
     AND g.id = sn.game_id
     AND sn.email_sent_at IS NULL
     AND sn.created_at > now() - interval '1 hour'
  RETURNING sn.user_id, g.title::text, sn.original_price, sn.sale_price;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_sale_notification_email(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sale_notification_email(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.notify_wishlist_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  wishlist_record RECORD;
  alert_record RECORD;
  edge_function_url TEXT;
  current_price NUMERIC;
  new_notification_id UUID;
BEGIN
  current_price := COALESCE(NEW.sale_price, NEW.price);

  IF NEW.sale_price IS NOT NULL AND NEW.sale_price < NEW.price AND
     (OLD.sale_price IS NULL OR OLD.sale_price != NEW.sale_price) THEN

    edge_function_url := 'https://qvnkjxhgqhfktilzeawr.supabase.co/functions/v1/send-sale-notification-email';

    FOR wishlist_record IN
      SELECT w.user_id, COALESCE(p.sale_email_notifications, true) as wants_email
      FROM public.wishlist w
      LEFT JOIN public.profiles p ON p.user_id = w.user_id
      WHERE w.game_id = NEW.id
    LOOP
      new_notification_id := NULL;
      INSERT INTO public.sale_notifications (user_id, game_id, original_price, sale_price)
      VALUES (wishlist_record.user_id, NEW.id, NEW.price, NEW.sale_price)
      ON CONFLICT DO NOTHING
      RETURNING id INTO new_notification_id;

      -- Only the notification id is sent; the function loads all data server-side
      IF wishlist_record.wants_email AND new_notification_id IS NOT NULL THEN
        BEGIN
          PERFORM extensions.http_post(
            url := edge_function_url,
            body := jsonb_build_object('notification_id', new_notification_id)::text,
            headers := jsonb_build_object('Content-Type', 'application/json')
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'sale email dispatch failed: %', SQLERRM;
        END;
      END IF;
    END LOOP;
  END IF;

  IF current_price IS NOT NULL AND (OLD.price != NEW.price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price) THEN
    FOR alert_record IN
      SELECT pa.id, pa.user_id, pa.target_price
      FROM public.wishlist_price_alerts pa
      WHERE pa.game_id = NEW.id
        AND pa.notified = false
        AND current_price <= pa.target_price
    LOOP
      INSERT INTO public.sale_notifications (user_id, game_id, original_price, sale_price)
      VALUES (alert_record.user_id, NEW.id, NEW.price, current_price)
      ON CONFLICT DO NOTHING;

      UPDATE public.wishlist_price_alerts SET notified = true WHERE id = alert_record.id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- ===== P2: profile search =====
CREATE OR REPLACE FUNCTION public.search_profile_user_ids(_query text, _limit int DEFAULT 50)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND _query IS NOT NULL
    AND length(trim(_query)) BETWEEN 2 AND 64
    AND (
      p.username ILIKE '%' || replace(replace(replace(trim(_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
      -- UUID prefix lookup only for sufficiently specific hex prefixes
      OR (trim(_query) ~* '^[0-9a-f-]{8,36}$' AND p.user_id::text ILIKE lower(trim(_query)) || '%')
    )
  LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 50)
$$;
REVOKE ALL ON FUNCTION public.search_profile_user_ids(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_profile_user_ids(text, int) TO authenticated;

-- ===== P3: friendships =====
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND user_id <> friend_id);

CREATE OR REPLACE FUNCTION public.enforce_friendship_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- trusted server-side context
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.friend_id IS DISTINCT FROM OLD.friend_id THEN
    RAISE EXCEPTION 'Friendship participants cannot be changed';
  END IF;
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    IF OLD.status <> 'pending' OR auth.uid() <> OLD.friend_id THEN
      RAISE EXCEPTION 'Only the recipient can accept a friend request';
    END IF;
  END IF;
  IF NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Cannot revert a friendship to pending';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_friendship_update ON public.friendships;
CREATE TRIGGER enforce_friendship_update
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_friendship_update();

-- ===== P6: messaging =====
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants
                 WHERE conversation_id = _conversation_id AND user_id = _user_id)
$$;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

-- Previously any signed-in user could add anyone (including themselves) to any conversation.
-- Now: existing participants may add others; the first participant row of a new, empty
-- conversation must be the caller themselves.
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add participants"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.is_conversation_participant(conversation_id, auth.uid())
    OR (
      user_id = auth.uid()
      AND NOT EXISTS (SELECT 1 FROM public.conversation_participants cp2
                      WHERE cp2.conversation_id = conversation_participants.conversation_id)
    )
  );

-- Atomic direct-conversation creation (finds existing 1:1 or creates one)
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _conv uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _other_user_id IS NULL OR _other_user_id = _me THEN RAISE EXCEPTION 'Invalid recipient'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _other_user_id) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;
  IF EXISTS (SELECT 1 FROM public.blocked_users
             WHERE (user_id = _me AND blocked_user_id = _other_user_id)
                OR (user_id = _other_user_id AND blocked_user_id = _me)) THEN
    RAISE EXCEPTION 'Cannot message this user';
  END IF;

  SELECT a.conversation_id INTO _conv
  FROM public.conversation_participants a
  JOIN public.conversation_participants b ON b.conversation_id = a.conversation_id
  WHERE a.user_id = _me AND b.user_id = _other_user_id
  LIMIT 1;
  IF _conv IS NOT NULL THEN RETURN _conv; END IF;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO _conv;
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (_conv, _me), (_conv, _other_user_id);
  RETURN _conv;
END;
$$;
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) TO authenticated;

-- Recipients could not mark messages read (UPDATE policy is sender-only). Do it via a scoped function.
CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_conversation_participant(_conversation_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;
  UPDATE public.messages SET read_at = now()
   WHERE conversation_id = _conversation_id
     AND sender_id <> auth.uid()
     AND read_at IS NULL;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;
