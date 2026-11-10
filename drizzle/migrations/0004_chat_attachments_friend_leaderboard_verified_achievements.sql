-- Private chat attachment ownership; MIME restrictions are enforced in write policies.
CREATE POLICY "Chat attachment owners can read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Chat attachment owners can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text
 AND metadata->>'mimetype' = ANY (ARRAY['image/jpeg','image/png','image/gif','image/webp','image/avif','image/bmp','image/tiff','image/heic','image/heif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/zip','application/x-zip-compressed']));
CREATE POLICY "Chat attachment owners can update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text
 AND metadata->>'mimetype' = ANY (ARRAY['image/jpeg','image/png','image/gif','image/webp','image/avif','image/bmp','image/tiff','image/heic','image/heif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/zip','application/x-zip-compressed']));
CREATE POLICY "Chat attachment owners can delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.get_friend_leaderboard()
RETURNS TABLE(user_id uuid, username text, avatar_url text, total_playtime bigint, games_owned bigint, achievement_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE _me uuid := auth.uid();
BEGIN
 IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
 RETURN QUERY
 WITH allowed_users AS (
   SELECT _me AS id
   UNION
   SELECT CASE WHEN f.user_id = _me THEN f.friend_id ELSE f.user_id END
   FROM public.friendships f
   WHERE f.status = 'accepted' AND (f.user_id = _me OR f.friend_id = _me)
 )
 SELECT u.id, COALESCE(p.username, 'Unknown'), p.avatar_url,
   COALESCE(l.playtime, 0)::bigint, COALESCE(l.games, 0)::bigint, COALESCE(a.achievements, 0)::bigint
 FROM allowed_users u
 LEFT JOIN public.profiles p ON p.user_id = u.id
 LEFT JOIN LATERAL (SELECT sum(ul.play_time_minutes)::bigint AS playtime, count(*) AS games
                    FROM public.user_library ul WHERE ul.user_id = u.id) l ON true
 LEFT JOIN LATERAL (SELECT count(*) AS achievements
                    FROM public.user_achievements ua WHERE ua.user_id = u.id) a ON true;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_friend_leaderboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_leaderboard() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.unlock_achievement_if_eligible(achievement_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
 _me uuid := auth.uid();
 _requirement public.achievements%ROWTYPE;
 _actual bigint;
 _inserted integer;
BEGIN
 IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
 IF achievement_id IS NULL THEN RAISE EXCEPTION 'Achievement is required' USING ERRCODE = '22023'; END IF;
 SELECT a.* INTO _requirement FROM public.achievements a WHERE a.id = achievement_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Achievement not found' USING ERRCODE = '22023'; END IF;
 IF _requirement.requirement_value < 0 THEN RETURN false; END IF;
 CASE _requirement.requirement_type
 WHEN 'games_owned' THEN
   SELECT count(*) INTO _actual FROM public.user_library ul WHERE ul.user_id = _me;
 WHEN 'total_playtime' THEN
   SELECT COALESCE(sum(ul.play_time_minutes), 0) INTO _actual FROM public.user_library ul WHERE ul.user_id = _me;
 WHEN 'friends_count' THEN
   SELECT count(DISTINCT CASE WHEN f.user_id = _me THEN f.friend_id ELSE f.user_id END)
   INTO _actual FROM public.friendships f
   WHERE f.status = 'accepted' AND (f.user_id = _me OR f.friend_id = _me);
 WHEN 'reviews_written' THEN
   SELECT count(*) INTO _actual FROM public.game_reviews r WHERE r.user_id = _me;
 ELSE RETURN false;
 END CASE;
 IF _actual < _requirement.requirement_value THEN RETURN false; END IF;
 INSERT INTO public.user_achievements (user_id, achievement_id)
 VALUES (_me, _requirement.id)
 ON CONFLICT (user_id, achievement_id) DO NOTHING;
 GET DIAGNOSTICS _inserted = ROW_COUNT;
 RETURN _inserted = 1;
END;
$function$;
REVOKE ALL ON FUNCTION public.unlock_achievement_if_eligible(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_achievement_if_eligible(uuid) TO authenticated, service_role;
REVOKE INSERT ON TABLE public.user_achievements FROM authenticated, anon;
DROP POLICY IF EXISTS "Users can unlock achievements" ON public.user_achievements;