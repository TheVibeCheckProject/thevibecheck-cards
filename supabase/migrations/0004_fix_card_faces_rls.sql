-- Drop existing policies to ensure clean slate
drop policy if exists "Users can select own card faces" on card_faces;
drop policy if exists "Users can insert own card faces" on card_faces;
drop policy if exists "Users can update own card faces" on card_faces;
drop policy if exists "Users can delete own card faces" on card_faces;

-- Recreate policies with explicit checks
create policy "Users can select own card faces" on card_faces
  for select using (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );

create policy "Users can insert own card faces" on card_faces
  for insert with check (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );

create policy "Users can update own card faces" on card_faces
  for update
  using (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  )
  with check (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );

create policy "Users can delete own card faces" on card_faces
  for delete using (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );
