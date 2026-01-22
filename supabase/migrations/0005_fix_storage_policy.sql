-- Add missing UPDATE policy for storage objects to allow overwrites
-- Required for idempotent exports (Milestone 5)

create policy "Users can update their own card assets"
on storage.objects for update
using (
  bucket_id = 'card-assets' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = 'cards' and
  (storage.foldername(name))[2]::uuid = auth.uid()
)
with check (
  bucket_id = 'card-assets' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = 'cards' and
  (storage.foldername(name))[2]::uuid = auth.uid()
);
