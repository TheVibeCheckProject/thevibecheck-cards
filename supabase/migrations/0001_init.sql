-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: cards
create table if not exists cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Card',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Table: card_designs
create table if not exists card_designs (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Table: card_faces
create table if not exists card_faces (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null unique,
  front_url text,
  inside_left_url text,
  inside_right_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Table: deliveries
create table if not exists deliveries (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null unique,
  recipient_name text,
  share_token text not null unique,
  open_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Table: templates
create table if not exists templates (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  cover_url text,
  design_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes (good practice)
create index if not exists cards_user_id_idx on cards(user_id);
create index if not exists deliveries_share_token_idx on deliveries(share_token);
