-- ============================================================
-- SUPABASE SETUP for "Lovely Couple" shared photo album
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- After running, copy your project URL + anon key into js/config.js
-- ============================================================

-- 1) Photos table (metadata for every uploaded image)
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Our Memory',
  description text default '',
  category text not null default 'everyday',
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- 2) Public storage bucket for the images
insert into storage.buckets (id, name, public)
values ('couple-album', 'couple-album', true)
on conflict (id) do update set public = true;

-- 3) Grants so the anon (no-login) role can use everything
grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.photos to anon, authenticated;
grant usage on schema storage to anon, authenticated;

-- 4) Row Level Security for the photos table
alter table public.photos enable row level security;

drop policy if exists "public read photos" on public.photos;
create policy "public read photos" on public.photos
  for select using (true);

drop policy if exists "anon insert photos" on public.photos;
create policy "anon insert photos" on public.photos
  for insert with check (true);

drop policy if exists "anon delete photos" on public.photos;
create policy "anon delete photos" on public.photos
  for delete using (true);

-- 5) Storage object policies (upload / delete / public read)
drop policy if exists "anon upload objects" on storage.objects;
create policy "anon upload objects" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'couple-album');

drop policy if exists "anon delete objects" on storage.objects;
create policy "anon delete objects" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'couple-album');

drop policy if exists "public read objects" on storage.objects;
create policy "public read objects" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'couple-album');

-- 6) Realtime: everyone sees new photos instantly (no refresh needed)
do $$
begin
  alter publication supabase_realtime add table public.photos;
exception when others then
  raise notice 'Could not add table to realtime publication: %', sqlerrm;
end $$;
