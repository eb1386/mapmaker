-- profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text,
  created_at timestamptz not null default now()
);

-- maps table
create table if not exists public.maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null check (slug ~ '^[a-z0-9_-]{1,60}$'),
  title text not null default 'My Map',
  description text,
  center_lng double precision not null default -123.115,
  center_lat double precision not null default 49.255,
  zoom double precision not null default 11.4,
  color_accent text not null default '#E8556B',
  color_accent_deep text not null default '#C8364C',
  color_accent_soft text not null default '#F8C9D2',
  color_bg text not null default '#FBF6F1',
  color_ink text not null default '#2A1F1A',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- map locations
create table if not exists public.map_locations (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps(id) on delete cascade,
  name text not null default 'New Place',
  lng double precision not null,
  lat double precision not null,
  photos text[] not null default '{}',
  fits text[] not null default '{}',
  audio text,
  citation text,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- indexes
create index if not exists idx_maps_user on public.maps (user_id);
create index if not exists idx_maps_slug on public.maps (slug);
create index if not exists idx_map_locations_map on public.map_locations (map_id);
create index if not exists idx_map_locations_sort on public.map_locations (map_id, sort_order);

-- enable rls
alter table public.profiles enable row level security;
alter table public.maps enable row level security;
alter table public.map_locations enable row level security;

-- profiles policies
create policy "profiles_public_read" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- maps policies
create policy "maps_public_read" on public.maps
  for select using (is_public = true or auth.uid() = user_id);

create policy "maps_insert_own" on public.maps
  for insert with check (auth.uid() = user_id);

create policy "maps_update_own" on public.maps
  for update using (auth.uid() = user_id);

create policy "maps_delete_own" on public.maps
  for delete using (auth.uid() = user_id);

-- map_locations policies
create policy "map_locations_read" on public.map_locations
  for select using (
    exists (
      select 1 from public.maps
      where maps.id = map_locations.map_id
      and (maps.is_public = true or maps.user_id = auth.uid())
    )
  );

create policy "map_locations_insert" on public.map_locations
  for insert with check (
    exists (
      select 1 from public.maps
      where maps.id = map_locations.map_id
      and maps.user_id = auth.uid()
    )
  );

create policy "map_locations_update" on public.map_locations
  for update using (
    exists (
      select 1 from public.maps
      where maps.id = map_locations.map_id
      and maps.user_id = auth.uid()
    )
  );

create policy "map_locations_delete" on public.map_locations
  for delete using (
    exists (
      select 1 from public.maps
      where maps.id = map_locations.map_id
      and maps.user_id = auth.uid()
    )
  );

-- storage buckets
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('audio', 'audio', true) on conflict do nothing;

-- storage policies
create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos_auth_upload" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "photos_owner_delete" on storage.objects
  for delete using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "audio_public_read" on storage.objects
  for select using (bucket_id = 'audio');

create policy "audio_auth_upload" on storage.objects
  for insert with check (bucket_id = 'audio' and auth.role() = 'authenticated');

create policy "audio_owner_delete" on storage.objects
  for delete using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists maps_updated_at on public.maps;
create trigger maps_updated_at
  before update on public.maps
  for each row execute function public.set_updated_at();

-- migrate old locations to demo map
-- (skip if profiles/maps don't have demo data yet)
