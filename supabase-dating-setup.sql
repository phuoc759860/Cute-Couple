-- ============================================================
-- SUPABASE SETUP for "Lovely Couple" — Dating + Notifications
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- (in the SAME project as supabase-setup.sql)
-- ============================================================

-- 1) Date requests — one partner proposes a date, the other accepts/declines
create table if not exists public.date_requests (
  id uuid primary key default gen_random_uuid(),
  proposer text not null check (proposer in ('boyfriend','girlfriend')),
  title text not null,
  date_time timestamptz not null,
  place text not null default '',
  activity text not null default 'date',
  note text not null default '',
  duration text not null default '',
  importance text not null default 'casual',
  response_note text not null default '',
  status text not null default 'pending'
    check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- 2) Notifications — in-app alerts for the other partner
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient text not null check (recipient in ('boyfriend','girlfriend')),
  type text not null default 'date_request',
  title text not null,
  body text not null default '',
  href text not null default '#dates',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3) Permissions for the anon role (matches the main album setup)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.date_requests to anon, authenticated;
grant select, insert, update, delete on public.notifications to anon, authenticated;

-- 4) Row Level Security — open to the couple's anon-role app
alter table public.date_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "public read date_requests" on public.date_requests;
create policy "public read date_requests" on public.date_requests for select using (true);

drop policy if exists "anon insert date_requests" on public.date_requests;
create policy "anon insert date_requests" on public.date_requests for insert with check (true);

drop policy if exists "anon update date_requests" on public.date_requests;
create policy "anon update date_requests" on public.date_requests
  for update using (true) with check (true);

drop policy if exists "anon delete date_requests" on public.date_requests;
create policy "anon delete date_requests" on public.date_requests for delete using (true);

drop policy if exists "public read notifications" on public.notifications;
create policy "public read notifications" on public.notifications for select using (true);

drop policy if exists "anon insert notifications" on public.notifications;
create policy "anon insert notifications" on public.notifications for insert with check (true);

drop policy if exists "anon update notifications" on public.notifications;
create policy "anon update notifications" on public.notifications
  for update using (true) with check (true);

drop policy if exists "anon delete notifications" on public.notifications;
create policy "anon delete notifications" on public.notifications for delete using (true);

-- 5) Realtime so requests & notifications update live for both partners
do $$
begin
  alter publication supabase_realtime add table public.date_requests;
  alter publication supabase_realtime add table public.notifications;
exception when others then
  raise notice 'Could not add table to realtime publication: %', sqlerrm;
end $$;