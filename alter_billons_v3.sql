-- ============================================================
-- BILLONS V3 — Add agricultural fields to billons
-- Run AFTER supabase_billons_v2.sql
-- ============================================================

alter table public.billons
  add column if not exists crop_variety text,
  add column if not exists plant_count integer,
  add column if not exists planting_date date,
  add column if not exists area_m2 numeric,
  add column if not exists irrigation_system text
    check (irrigation_system in ('goutte_a_goutte','aspersion','gravitaire','micro_aspersion')),
  add column if not exists seed_type text
    check (seed_type in ('semence','plant','bulbe','greffon','autre')),
  add column if not exists growing_cycle integer;
