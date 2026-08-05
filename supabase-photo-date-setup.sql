-- ============================================================
-- Add a custom photo date (taken_at) to the photos table
-- Run this once in the Supabase SQL Editor.
-- (If you already ran this, it's safe to run again.)
-- ============================================================

alter table public.photos add column if not exists taken_at date;

-- grant is kept in sync with the other photo columns
grant select, insert, update on public.photos to anon, authenticated;
