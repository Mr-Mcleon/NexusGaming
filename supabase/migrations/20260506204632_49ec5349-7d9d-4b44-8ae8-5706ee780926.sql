CREATE TABLE public.rls_verification_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ran_as_admin BOOLEAN NOT NULL DEFAULT false,
  total_count INTEGER NOT NULL DEFAULT 0,
  pass_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  warn_count INTEGER NOT NULL DEFAULT 0,
  overall TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rls_verification_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own runs"
ON public.rls_verification_runs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own runs"
ON public.rls_verification_runs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all runs"
ON public.rls_verification_runs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete runs"
ON public.rls_verification_runs
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_rls_verification_runs_created_at ON public.rls_verification_runs (created_at DESC);
CREATE INDEX idx_rls_verification_runs_user_id ON public.rls_verification_runs (user_id);