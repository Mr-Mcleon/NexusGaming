
-- Linked external platform accounts (Steam, Xbox, PlayStation, Google Play, etc.)
CREATE TABLE public.linked_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT,
  display_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own linked accounts"
  ON public.linked_accounts FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own linked accounts"
  ON public.linked_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own linked accounts"
  ON public.linked_accounts FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own linked accounts"
  ON public.linked_accounts FOR DELETE
  USING (auth.uid() = user_id);

REVOKE SELECT ON public.linked_accounts FROM anon;

CREATE TRIGGER linked_accounts_set_updated
  BEFORE UPDATE ON public.linked_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- External games detected/imported from linked platforms
CREATE TABLE public.external_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  linked_account_id UUID REFERENCES public.linked_accounts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  playtime_minutes INTEGER NOT NULL DEFAULT 0,
  installed BOOLEAN NOT NULL DEFAULT false,
  last_played_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, platform, external_id)
);

CREATE INDEX idx_external_games_user ON public.external_games(user_id);
CREATE INDEX idx_external_games_account ON public.external_games(linked_account_id);

ALTER TABLE public.external_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own external games"
  ON public.external_games FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own external games"
  ON public.external_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own external games"
  ON public.external_games FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own external games"
  ON public.external_games FOR DELETE
  USING (auth.uid() = user_id);

REVOKE SELECT ON public.external_games FROM anon;
