-- ============================================================
-- BILLONS SYSTEM V2 — Independent billons (no plot_id)
-- Run this in Supabase SQL Editor AFTER dropping old tables
-- ============================================================

drop table if exists public.billon_cycle_history cascade;
drop table if exists public.billon_activities cascade;
drop table if exists public.billons cascade;

create table public.billons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'fallow', 'harvested')),
  image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.billon_activities (
  id uuid default uuid_generate_v4() primary key,
  billon_id uuid references public.billons(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('irrigation', 'fertilization', 'planting', 'harvest', 'observation', 'other')),
  notes text,
  image_url text,
  performed_at timestamp with time zone default timezone('utc'::text, now()),
  performed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS
alter table public.billons enable row level security;
alter table public.billon_activities enable row level security;

-- Billons: Public read
create policy "Billons are viewable by everyone"
  on billons for select using ( true );

-- Billons: Staff insert
create policy "Staff can insert billons"
  on billons for insert
  with check ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Billons: Staff update
create policy "Staff can update billons"
  on billons for update
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Billons: Staff delete
create policy "Staff can delete billons"
  on billons for delete
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Billon Activities: Public read
create policy "Billon activities are viewable by everyone"
  on billon_activities for select using ( true );

-- Billon Activities: Staff insert
create policy "Staff can insert billon activities"
  on billon_activities for insert
  with check ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));

-- Billon Activities: Staff update
create policy "Staff can update billon activities"
  on billon_activities for update
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));

-- Billon Activities: Staff delete
create policy "Staff can delete billon activities"
  on billon_activities for delete
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));
