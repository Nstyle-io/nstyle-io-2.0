-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);

-- Create storage policies for post media
CREATE POLICY "Users can upload their own post media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view post media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own post media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);