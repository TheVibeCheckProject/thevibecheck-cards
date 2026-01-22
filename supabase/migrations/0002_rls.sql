-- Enable RLS on all tables
alter table cards enable row level security;
alter table card_designs enable row level security;
alter table card_faces enable row level security;
alter table deliveries enable row level security;
alter table templates enable row level security;

-- Policies for cards
-- Users can do everything with their own cards
create policy "Users can select own cards" on cards
  for select using (auth.uid() = user_id);

create policy "Users can insert own cards" on cards
  for insert with check (auth.uid() = user_id);

create policy "Users can update own cards" on cards
  for update using (auth.uid() = user_id);

create policy "Users can delete own cards" on cards
  for delete using (auth.uid() = user_id);


-- Policies for card_designs
-- Access controlled via the parent card's ownership
create policy "Users can select own card designs" on card_designs
  for select using (
    exists ( select 1 from cards where id = card_designs.card_id and user_id = auth.uid() )
  );

create policy "Users can insert own card designs" on card_designs
  for insert with check (
    exists ( select 1 from cards where id = card_designs.card_id and user_id = auth.uid() )
  );

create policy "Users can update own card designs" on card_designs
  for update using (
    exists ( select 1 from cards where id = card_designs.card_id and user_id = auth.uid() )
  );

create policy "Users can delete own card designs" on card_designs
  for delete using (
    exists ( select 1 from cards where id = card_designs.card_id and user_id = auth.uid() )
  );


-- Policies for card_faces
-- Access controlled via the parent card's ownership
create policy "Users can select own card faces" on card_faces
  for select using (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );

create policy "Users can insert own card faces" on card_faces
  for insert with check (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );

create policy "Users can update own card faces" on card_faces
  for update using (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );

create policy "Users can delete own card faces" on card_faces
  for delete using (
    exists ( select 1 from cards where id = card_faces.card_id and user_id = auth.uid() )
  );


-- Policies for deliveries
-- Access controlled via the parent card's ownership
create policy "Users can select own deliveries" on deliveries
  for select using (
    exists ( select 1 from cards where id = deliveries.card_id and user_id = auth.uid() )
  );

create policy "Users can insert own deliveries" on deliveries
  for insert with check (
    exists ( select 1 from cards where id = deliveries.card_id and user_id = auth.uid() )
  );

create policy "Users can update own deliveries" on deliveries
  for update using (
    exists ( select 1 from cards where id = deliveries.card_id and user_id = auth.uid() )
  );

create policy "Users can delete own deliveries" on deliveries
  for delete using (
    exists ( select 1 from cards where id = deliveries.card_id and user_id = auth.uid() )
  );


-- Policies for templates
-- Public read access for everyone (authenticated or anon)
create policy "Templates are public readable" on templates
  for select using (true);
  
-- Only service role (admin) can insert/update/delete templates (no policy needed for implicit deny, but explicit is fine)
-- We will rely on default deny for insert/update/delete on templates for normal users.
