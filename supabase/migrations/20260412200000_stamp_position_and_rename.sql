-- add stamp position columns
alter table public.maps add column if not exists stamp_x double precision not null default 22;
alter table public.maps add column if not exists stamp_y double precision not null default 20;
alter table public.maps add column if not exists show_heart boolean not null default false;
