-- ============================================================
-- BILLONS & BILLON ACTIVITIES Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (if not already)
create extension if not exists "uuid-ossp";

-- BILLONS (12 raised beds per plot)
create table public.billons (
  id uuid default uuid_generate_v4() primary key,
  plot_id text references public.plots(id) on delete cascade not null,
  billon_number integer not null check (billon_number between 1 and 12),
  status text default 'empty' check (status in ('empty', 'planted', 'resting')),
  current_crop text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(plot_id, billon_number)
);

-- BILLON ACTIVITIES (logs of operations on individual billons)
create table public.billon_activities (
  id uuid default uuid_generate_v4() primary key,
  billon_id uuid references public.billons(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('irrigation', 'fertilization', 'planting', 'harvest', 'other')),
  crop_type text,
  irrigation_date date,
  fertilizer_amount numeric,
  fertilizer_unit text default 'kg',
  notes text,
  performed_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ============================================================
-- RLS POLICIES (same pattern as plots/operations)
-- ============================================================

alter table public.billons enable row level security;
alter table public.billon_activities enable row level security;

-- Billons: Public read
create policy "Billons are viewable by everyone"
  on billons for select
  using ( true );

-- Billons: Staff can insert
create policy "Staff can insert billons"
  on billons for insert
  with check ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Billons: Staff can update
create policy "Staff can update billons"
  on billons for update
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Billons: Staff can delete
create policy "Staff can delete billons"
  on billons for delete
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Billon Activities: Public read
create policy "Billon activities are viewable by everyone"
  on billon_activities for select
  using ( true );

-- Billon Activities: Staff can insert
create policy "Staff can insert billon activities"
  on billon_activities for insert
  with check ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));

-- Billon Activities: Staff can update
create policy "Staff can update billon activities"
  on billon_activities for update
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));
