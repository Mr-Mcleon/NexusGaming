
-- Create storage bucket for clips
INSERT INTO storage.buckets (id, name, public)
VALUES ('clips', 'clips', false);

-- Storage policies for clips bucket
CREATE POLICY "Users can upload their own clips"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own clips"
ON storage.objects FOR SELECT
USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clips"
ON storage.objects FOR DELETE
USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own clips"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create cloud_clips table for metadata
CREATE TABLE public.cloud_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  duration NUMERIC NOT NULL DEFAULT 0,
  size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, local_id)
);

ALTER TABLE public.cloud_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cloud clips"
ON public.cloud_clips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cloud clips"
ON public.cloud_clips FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cloud clips"
ON public.cloud_clips FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cloud clips"
ON public.cloud_clips FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_cloud_clips_updated_at
BEFORE UPDATE ON public.cloud_clips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
