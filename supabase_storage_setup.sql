-- SQL Script to set up Storage Buckets and RLS Policies
-- Execute this in the Supabase SQL Editor

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('plots-images', 'plots-images', true),
  ('operations-images', 'operations-images', true),
  ('disease-images', 'disease-images', true),
  ('plot-gallery', 'plot-gallery', true),
  ('yield-images', 'yield-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS Policies for Storage
-- Allow anyone to read public buckets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('plots-images', 'operations-images', 'disease-images', 'plot-gallery', 'yield-images') );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id IN ('plots-images', 'operations-images', 'disease-images', 'plot-gallery', 'yield-images')
);

-- Allow authenticated users to delete their own files (or all if admin, but here simplified to authenticated)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id IN ('plots-images', 'operations-images', 'disease-images', 'plot-gallery', 'yield-images')
);
