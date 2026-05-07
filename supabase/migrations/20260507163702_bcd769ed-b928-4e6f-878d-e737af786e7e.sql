-- Enable trigram extension for fast ILIKE search on usernames
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Trigram index on lowercased username for fast case-insensitive partial matches
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm
  ON public.profiles USING gin (lower(username) extensions.gin_trgm_ops);

-- B-tree index on user_id (used for IN lookups when joining matched ids)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

-- Helper function: returns user_ids whose username matches a query (partial, case-insensitive)
-- or whose user_id matches when the query looks like a UUID fragment.
CREATE OR REPLACE FUNCTION public.search_profile_user_ids(_query text, _limit int DEFAULT 200)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id
  FROM public.profiles p
  WHERE _query IS NOT NULL
    AND length(trim(_query)) > 0
    AND (
      p.username ILIKE '%' || _query || '%'
      OR p.user_id::text ILIKE _query || '%'
    )
  LIMIT GREATEST(_limit, 1)
$$;

GRANT EXECUTE ON FUNCTION public.search_profile_user_ids(text, int) TO authenticated, anon;