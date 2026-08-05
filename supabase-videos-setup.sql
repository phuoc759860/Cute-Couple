-- ============================================================
-- Video Gallery setup for the couple album
-- Run this in the Supabase SQL Editor once.
-- It reuses the existing "couple-album" storage bucket,
-- so no new bucket needs to be created.
-- ============================================================

-- 1) Videos table
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Our Moment',
  description text default '',
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- 2) Permissions (same open model as the photos table)
grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.videos to anon, authenticated;

-- 3) Row Level Security
alter table public.videos enable row level security;

drop policy if exists "public read videos" on public.videos;
create policy "public read videos"
  on public.videos for select
  using (true);

drop policy if exists "anon insert videos" on public.videos;
create policy "anon insert videos"
  on public.videos for insert
  with check (true);

drop policy if exists "anon delete videos" on public.videos;
create policy "anon delete videos"
  on public.videos for delete
  using (true);

-- 4) Realtime (so new videos appear instantly for everyone)
do $$
begin
  alter publication supabase_realtime add table public.videos;
exception when duplicate_object then
  raise notice 'videos already in realtime publication';
end $$;
