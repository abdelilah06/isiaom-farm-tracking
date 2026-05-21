-- ============================================================
-- BILLONS V4 — Cycle system (crop rotation tracking)
-- Run AFTER supabase_billons_v2.sql and alter_billons_v3.sql
-- ============================================================

-- 1) Create billon_cycles table
create table if not exists public.billon_cycles (
  id uuid default uuid_generate_v4() primary key,
  billon_id uuid references public.billons(id) on delete cascade not null,
  cycle_number integer not null,
  crop_variety text,
  plant_count integer,
  planting_date date,
  harvest_date date,
  growing_cycle_days integer,
  seed_type text check (seed_type in ('conventional', 'hybrid', 'organic')),
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  yield_kg numeric(10,2),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(billon_id, cycle_number)
);

-- 2) Add active_cycle_id to billons
alter table public.billons
  add column if not exists active_cycle_id uuid references public.billon_cycles(id) on delete set null;

-- 3-5) Migrate existing data IF v3 columns exist (otherwise skip)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'billons' and column_name = 'crop_variety'
  ) then
    execute 'insert into public.billon_cycles (billon_id, cycle_number, crop_variety, plant_count, planting_date, growing_cycle_days, seed_type, status) '
      || 'select billons.id, 1, billons.crop_variety, billons.plant_count, billons.planting_date, billons.growing_cycle, billons.seed_type, '
      || '  case when billons.status = ''active'' then ''active'' else ''completed'' end '
      || 'from public.billons '
      || 'where billons.crop_variety is not null or billons.plant_count is not null';

    execute 'update public.billons b set active_cycle_id = bc.id from public.billon_cycles bc where bc.billon_id = b.id and bc.cycle_number = 1';

    execute 'alter table public.billons drop column if exists crop_variety, drop column if exists plant_count, drop column if exists planting_date, drop column if exists seed_type, drop column if exists growing_cycle';
  end if;
end $$;

-- ============================================================
-- RLS POLICIES for billon_cycles
-- ============================================================
alter table public.billon_cycles enable row level security;

create policy "Billon cycles are viewable by everyone"
  on public.billon_cycles for select using (true);

create policy "Staff can insert billon cycles"
  on public.billon_cycles for insert
  with check (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));

create policy "Staff can update billon cycles"
  on public.billon_cycles for update
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

create policy "Staff can delete billon cycles"
  on public.billon_cycles for delete
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));
