
-- Create the audio_files storage bucket for interview recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio_files', 'audio_files', true);

-- Create policy to allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload their own audio files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio_files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow authenticated users to view their own audio files
CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT USING (bucket_id = 'audio_files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
FOR DELETE USING (bucket_id = 'audio_files' AND auth.uid()::text = (storage.foldername(name))[1]);
