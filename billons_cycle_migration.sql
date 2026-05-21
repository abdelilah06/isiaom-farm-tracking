-- ============================================================
-- BILLONS CYCLE SYSTEM — Migration
-- Adds dynamic dimensions & cycle history archive
-- Run in Supabase SQL Editor
-- ============================================================

-- 1) Add dimension columns to billons
alter table public.billons
  add column if not exists length_m numeric,
  add column if not exists area_m2  numeric;

-- 2) Drop the fixed 1–12 constraint on billon_number
--    (allows unlimited billons per plot)
alter table public.billons
  drop constraint if exists billons_billon_number_check;

-- 3) Add planted_at to track when the current cycle started
alter table public.billons
  add column if not exists planted_at timestamp with time zone;

-- ============================================================
-- CYCLE HISTORY TABLE — Archive of closed cycles
-- ============================================================
create table if not exists public.billon_cycle_history (
  id                  uuid default uuid_generate_v4() primary key,
  billon_id           uuid references public.billons(id) on delete set null,
  plot_id             text references public.plots(id) on delete cascade not null,
  billon_number       integer not null,
  crop                text,
  planted_at          timestamp with time zone,
  harvested_at        timestamp with time zone not null,
  harvest_quantity_kg numeric not null default 0,
  length_m            numeric,
  area_m2             numeric,
  yield_per_m2        numeric,
  yield_per_linear_m  numeric,
  notes               text,
  closed_at           timestamp with time zone default timezone('utc'::text, now()),
  closed_by           uuid references auth.users(id) on delete set null
);

-- ============================================================
-- RLS POLICIES for billon_cycle_history
-- ============================================================
alter table public.billon_cycle_history enable row level security;

-- Public read
create policy "Cycle history is viewable by everyone"
  on billon_cycle_history for select
  using ( true );

-- Staff can insert
create policy "Staff can insert cycle history"
  on billon_cycle_history for insert
  with check ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));

-- Staff can update
create policy "Staff can update cycle history"
  on billon_cycle_history for update
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Staff can delete
create policy "Staff can delete cycle history"
  on billon_cycle_history for delete
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));
