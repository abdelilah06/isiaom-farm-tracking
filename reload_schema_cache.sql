-- ============================================================
-- 🛠️ MIGRATION: COMPLETE DATABASE FIX & SCHEMA CACHE RELOAD
-- Target: public.billons table in Supabase
--
-- INSTRUCTIONS:
-- 1. Copy this entire script.
-- 2. Open your Supabase Dashboard.
-- 3. Go to the "SQL Editor" tab.
-- 4. Create a new query, paste this script, and click "RUN".
-- ============================================================

BEGIN;

-- 1) Ensure all general agronomic and structural columns exist
ALTER TABLE public.billons 
  ADD COLUMN IF NOT EXISTS billon_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS length_m NUMERIC,
  ADD COLUMN IF NOT EXISTS area_m2 NUMERIC,
  ADD COLUMN IF NOT EXISTS width_top_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS inter_billon_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS ecartement_sur_rang_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS mode_semis TEXT,
  ADD COLUMN IF NOT EXISTS semis_layout TEXT,
  ADD COLUMN IF NOT EXISTS target_crop TEXT,
  ADD COLUMN IF NOT EXISTS variety TEXT,
  ADD COLUMN IF NOT EXISTS mulching TEXT,
  ADD COLUMN IF NOT EXISTS irrigation_system TEXT,
  ADD COLUMN IF NOT EXISTS irrigation_lines INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dripper_spacing_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS dripper_flow_rate_lh NUMERIC,
  ADD COLUMN IF NOT EXISTS soil_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_control_group BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS location_data JSONB,
  ADD COLUMN IF NOT EXISTS active_cycle_id UUID;

-- 2) Enforce unique code constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'billons_billon_code_key'
  ) THEN
    ALTER TABLE public.billons ADD CONSTRAINT billons_billon_code_key UNIQUE (billon_code);
  END IF;
END $$;

-- 3) Set up and recreate check constraints for advanced agronomy

-- Mode Semis Check Constraint
ALTER TABLE public.billons DROP CONSTRAINT IF EXISTS billons_mode_semis_check;
ALTER TABLE public.billons ADD CONSTRAINT billons_mode_semis_check 
  CHECK (mode_semis IN ('direct', 'plant', 'bulbe', 'bouture'));

-- Semis Layout Check Constraint
ALTER TABLE public.billons DROP CONSTRAINT IF EXISTS billons_semis_layout_check;
ALTER TABLE public.billons ADD CONSTRAINT billons_semis_layout_check 
  CHECK (semis_layout IN ('monorang', 'double_rang', 'quinconce'));

-- Mulching Check Constraint (Permits the new white plastic 'plastic_white')
ALTER TABLE public.billons DROP CONSTRAINT IF EXISTS billons_mulching_check;
ALTER TABLE public.billons ADD CONSTRAINT billons_mulching_check 
  CHECK (mulching IN ('none', 'plastic_black', 'plastic_transparent', 'organic_straw', 'plastic_white'));

-- Irrigation System Check Constraint (Enforces goutte_a_goutte strictly)
ALTER TABLE public.billons DROP CONSTRAINT IF EXISTS billons_irrigation_system_check;
ALTER TABLE public.billons ADD CONSTRAINT billons_irrigation_system_check 
  CHECK (irrigation_system IN ('goutte_a_goutte'));

-- Irrigation Lines Check Constraint
ALTER TABLE public.billons DROP CONSTRAINT IF EXISTS billons_irrigation_lines_check;
ALTER TABLE public.billons ADD CONSTRAINT billons_irrigation_lines_check 
  CHECK (irrigation_lines >= 0);

-- Status Check Constraint (Permits advanced PWA lifecycle statuses: active, fallow, harvested, empty, planted, resting)
ALTER TABLE public.billons DROP CONSTRAINT IF EXISTS billons_status_check;
ALTER TABLE public.billons ADD CONSTRAINT billons_status_check 
  CHECK (status IN ('active', 'fallow', 'harvested', 'empty', 'planted', 'resting'));

COMMIT;

-- 4) FORCE POSTGREST TO RELOAD THE SCHEMA CACHE IMMEDIATELY
-- This resolves the "Could not find column ... in the schema cache" mismatch error.
NOTIFY pgrst, 'reload schema';
