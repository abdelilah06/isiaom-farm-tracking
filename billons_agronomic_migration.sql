-- ============================================================
-- AGRONOMIC & EXPERIMENTAL BILLONS SYSTEM — Migration
-- Expands public.billons with advanced precision agronomy parameters
-- Run in Supabase SQL Editor
-- ============================================================

-- 1) Add new agronomic dimensions and codes
alter table public.billons
  add column if not exists billon_code varchar(100),
  add column if not exists width_top_cm numeric,
  add column if not exists height_cm numeric,
  add column if not exists inter_billon_cm numeric,
  add column if not exists ecartement_sur_rang_cm numeric;

-- 2) Make sure the billon_code is unique per plot if provided
alter table public.billons
  add constraint billons_billon_code_key unique (billon_code);

-- 3) Add sowing & layout columns with constraints
alter table public.billons
  add column if not exists mode_semis text check (mode_semis in ('direct', 'plant', 'bulbe', 'bouture')),
  add column if not exists semis_layout text check (semis_layout in ('monorang', 'double_rang', 'quinconce')),
  add column if not exists target_crop text,
  add column if not exists variety text;

-- 4) Add inputs and irrigation technology columns
alter table public.billons
  add column if not exists mulching text check (mulching in ('none', 'plastic_black', 'plastic_transparent', 'organic_straw')),
  add column if not exists irrigation_lines integer default 1 check (irrigation_lines >= 0),
  add column if not exists dripper_spacing_cm numeric,
  add column if not exists dripper_flow_rate_lh numeric;

-- 5) Add research and experimental trial columns
alter table public.billons
  add column if not exists soil_notes text,
  add column if not exists is_control_group boolean default false,
  add column if not exists location_data jsonb;

-- 6) Rename or map existing columns if necessary
-- Note: 'name' can be kept as a friendly display name or mapped to billon_code.
-- Note: 'area_m2' can be calculated dynamically as (length_m * (width_top_cm + inter_billon_cm) / 100) or kept as a physical footprint cache.
