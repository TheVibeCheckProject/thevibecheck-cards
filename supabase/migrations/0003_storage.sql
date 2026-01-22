-- Create the storage bucket for card assets
insert into storage.buckets (id, name, public)
values ('card-assets', 'card-assets', true)
on conflict (id) do nothing;

-- Policy: Authenticated users can upload assets to their own folder path
-- Path convention: cards/{userId}/{cardId}/assets/{fileName}
create policy "Users can upload their own card assets"
on storage.objects for insert
with check (
  bucket_id = 'card-assets' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = 'cards' and
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Policy: Users can read their own assets (and public can read if needed for viewer later, but strictly speaking owner for now)
-- Actually, viewer needs to read these too eventually. For v1, let's make it public read or owner read. 
-- Since we set public=true on bucket, public read is enabled by default if no policy restricts it? 
-- No, RLS on storage.objects usually requires explicit select policy.
create policy "Public Read Access"
on storage.objects for select
using ( bucket_id = 'card-assets' );

-- Policy: Users can delete their own assets
create policy "Users can delete their own card assets"
on storage.objects for delete
using (
  bucket_id = 'card-assets' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = 'cards' and
  (storage.foldername(name))[2]::uuid = auth.uid()
);
