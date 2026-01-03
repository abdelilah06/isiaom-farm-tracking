-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public profiles for users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text default 'worker' check (role in ('admin', 'manager', 'worker', 'viewer')),
  avatar_url text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PLOTS (The agricultural plots)
create table public.plots (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  location_data jsonb, -- Can store lat/long or polygon points
  area_sqm numeric,
  tree_spacing_row numeric,    -- In-row spacing in meters
  tree_spacing_between numeric, -- Between-rows spacing in meters
  plant_count numeric,          -- Manual plant/tree count
  training_method text check (training_method in ('goblet', 'central_axis', 'espalier')),
  crop_type text,
  planting_date date,
  status text default 'active' check (status in ('active', 'fallow', 'harvested')),
  image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- OPERATIONS (Logs of activities on plots)
create table public.operations (
  id uuid default uuid_generate_v4() primary key,
  plot_id uuid references public.plots(id) on delete cascade not null,
  operation_type text not null check (operation_type in ('irrigation', 'fertilization', 'pest_control', 'pruning', 'harvest', 'observation', 'planting', 'other')),
  notes text,
  image_url text, -- Photo evidence of the operation
  performed_at timestamp with time zone default timezone('utc'::text, now()),
  performed_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.plots enable row level security;
alter table public.operations enable row level security;

-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Plots: Public read (for QR codes), Admin/Manager/Worker write
create policy "Plots are viewable by everyone"
  on plots for select
  using ( true );

create policy "Staff can insert plots"
  on plots for insert
  with check ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

create policy "Staff can update plots"
  on plots for update
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager')
  ));

-- Operations: Public read, Staff write
create policy "Operations are viewable by everyone"
  on operations for select
  using ( true );

create policy "Staff can insert operations"
  on operations for insert
  with check ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));

create policy "Staff can update operations"
  on operations for update
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and role in ('admin', 'manager', 'worker')
  ));

-- FUNCTIONS
-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'worker');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
