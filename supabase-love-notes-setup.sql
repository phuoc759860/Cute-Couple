-- ============================================================
-- SUPABASE SETUP (optional) — interactive Love Notes guestbook
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- Only needed for the "Love Notes" section where visitors
-- can leave messages that stay on the site forever.
-- ============================================================

-- 1) Love messages table
create table if not exists public.love_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Anonymous',
  message text not null,
  created_at timestamptz not null default now()
);

-- 2) Grants so the anon (no-login) role can read and post
grant usage on schema public to anon, authenticated;
grant select, insert on public.love_messages to anon, authenticated;

-- 3) Row Level Security
alter table public.love_messages enable row level security;

drop policy if exists "public read love_messages" on public.love_messages;
create policy "public read love_messages" on public.love_messages
  for select using (true);

drop policy if exists "anon insert love_messages" on public.love_messages;
create policy "anon insert love_messages" on public.love_messages
  for insert with check (true);

-- 4) Realtime: new notes appear instantly
do $$
begin
  alter publication supabase_realtime add table public.love_messages;
exception when others then
  raise notice 'Could not add table to realtime publication: %', sqlerrm;
end $$;
