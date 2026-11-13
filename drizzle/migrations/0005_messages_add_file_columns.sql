ALTER TABLE public.messages
  ADD COLUMN file_url TEXT,
  ADD COLUMN file_name TEXT,
  ADD COLUMN file_type TEXT;