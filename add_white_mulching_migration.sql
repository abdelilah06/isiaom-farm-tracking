-- ============================================================
-- MIGRATION: ADD WHITE MULCHING OPTION
-- Drops and recreates the check constraint on the public.billons table
-- to permit 'plastic_white' as an agronomic soil cover treatment.
-- Run this script in the Supabase SQL Editor.
-- ============================================================

-- 1) Drop the legacy mulching check constraint
alter table public.billons 
  drop constraint if exists billons_mulching_check;

-- 2) Re-create the constraint including the new 'plastic_white' option
alter table public.billons 
  add constraint billons_mulching_check 
  check (mulching in ('none', 'plastic_black', 'plastic_transparent', 'organic_straw', 'plastic_white'));
