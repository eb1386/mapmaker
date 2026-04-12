-- create locations table
create table if not exists public.locations (
  id text primary key,
  name text not null,
  coords double precision[2] not null,
  photos text[] not null default '{}',
  fits text[] not null default '{}',
  audio text,
  citation text,
  body text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- enable rls
alter table public.locations enable row level security;

-- public read
create policy "locations_public_read" on public.locations
  for select using (true);

-- index sort
create index if not exists idx_locations_sort on public.locations (sort_order);
