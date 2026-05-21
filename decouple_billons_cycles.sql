-- ============================================================================
-- SQL Migration: Decouple raised beds (Billons) from cultivation cycles (Cycles)
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- 1) Add specifications columns to public.billon_cycles if they don't exist
alter table public.billon_cycles
  add column if not exists length_m numeric,
  add column if not exists width_top_cm numeric,
  add column if not exists height_cm numeric,
  add column if not exists inter_billon_cm numeric,
  add column if not exists ecartement_sur_rang_cm numeric,
  add column if not exists mode_semis text,
  add column if not exists semis_layout text,
  add column if not exists target_crop text,
  add column if not exists mulching text,
  add column if not exists irrigation_lines integer default 1,
  add column if not exists dripper_spacing_cm numeric,
  add column if not exists dripper_flow_rate_lh numeric,
  add column if not exists irrigation_system text default 'goutte_a_goutte',
  add column if not exists soil_notes text,
  add column if not exists is_control_group boolean default false;

-- 2) Data Migration: For each billon, if it has specs but NO cycle, let's create a cycle.
--    If it has an active cycle, let's copy specs from billons to its active cycle.

-- Create active cycles for billons that have specs but no active_cycle_id
do $$
declare
  b_rec record;
  new_cycle_id uuid;
begin
  for b_rec in 
    select * from public.billons 
    where active_cycle_id is null 
      and (target_crop is not null or length_m is not null or irrigation_lines is not null)
  loop
    -- Insert a new active cycle
    insert into public.billon_cycles (
      billon_id,
      cycle_number,
      target_crop,
      crop_variety,
      length_m,
      width_top_cm,
      height_cm,
      inter_billon_cm,
      ecartement_sur_rang_cm,
      mode_semis,
      semis_layout,
      mulching,
      irrigation_lines,
      dripper_spacing_cm,
      dripper_flow_rate_lh,
      irrigation_system,
      soil_notes,
      is_control_group,
      status,
      planting_date
    ) values (
      b_rec.id,
      1,
      b_rec.target_crop,
      b_rec.variety,
      b_rec.length_m,
      b_rec.width_top_cm,
      b_rec.height_cm,
      b_rec.inter_billon_cm,
      b_rec.ecartement_sur_rang_cm,
      b_rec.mode_semis,
      b_rec.semis_layout,
      b_rec.mulching,
      coalesce(b_rec.irrigation_lines, 1),
      b_rec.dripper_spacing_cm,
      b_rec.dripper_flow_rate_lh,
      coalesce(b_rec.irrigation_system, 'goutte_a_goutte'),
      b_rec.soil_notes,
      coalesce(b_rec.is_control_group, false),
      'active',
      now()
    ) returning id into new_cycle_id;

    -- Update billon to link to this cycle and set status to active/planted
    update public.billons 
    set active_cycle_id = new_cycle_id,
        status = 'planted'
    where id = b_rec.id;
  end loop;
end $$;

-- Update existing active cycles with current billon specs
update public.billon_cycles bc
set 
  length_m = b.length_m,
  width_top_cm = b.width_top_cm,
  height_cm = b.height_cm,
  inter_billon_cm = b.inter_billon_cm,
  ecartement_sur_rang_cm = b.ecartement_sur_rang_cm,
  mode_semis = b.mode_semis,
  semis_layout = b.semis_layout,
  target_crop = b.target_crop,
  mulching = b.mulching,
  irrigation_lines = coalesce(b.irrigation_lines, bc.irrigation_lines, 1),
  dripper_spacing_cm = b.dripper_spacing_cm,
  dripper_flow_rate_lh = b.dripper_flow_rate_lh,
  irrigation_system = coalesce(b.irrigation_system, bc.irrigation_system, 'goutte_a_goutte'),
  soil_notes = b.soil_notes,
  is_control_group = coalesce(b.is_control_group, bc.is_control_group, false)
from public.billons b
where bc.id = b.active_cycle_id;

-- 3) Clean up public.billons by dropping the redundant specs columns
alter table public.billons
  drop column if exists length_m,
  drop column if exists area_m2,
  drop column if exists width_top_cm,
  drop column if exists height_cm,
  drop column if exists inter_billon_cm,
  drop column if exists ecartement_sur_rang_cm,
  drop column if exists mode_semis,
  drop column if exists semis_layout,
  drop column if exists target_crop,
  drop column if exists variety,
  drop column if exists mulching,
  drop column if exists irrigation_lines,
  drop column if exists dripper_spacing_cm,
  drop column if exists dripper_flow_rate_lh,
  drop column if exists soil_notes,
  drop column if exists is_control_group,
  drop column if exists irrigation_system;

-- 4) Reload the postgrest schema cache
notify pgrst, 'reload schema';
