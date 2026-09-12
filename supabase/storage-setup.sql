-- Run in Supabase SQL editor, then create a public bucket named "wardrobe-images"
-- Dashboard → Storage → New bucket → wardrobe-images (public)

-- Optional: allow anonymous uploads for local testing (tighten before production)
-- create policy "Public read wardrobe images"
-- on storage.objects for select
-- using ( bucket_id = 'wardrobe-images' );
