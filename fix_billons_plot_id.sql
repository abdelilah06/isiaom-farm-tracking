-- ============================================================
-- FIX: Add missing plot_id column back to billons table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) Add plot_id column (nullable, since billons can exist without a plot now)
ALTER TABLE public.billons
  ADD COLUMN IF NOT EXISTS plot_id text;

-- 2) Add foreign key constraint (ON DELETE SET NULL so deleting a plot doesn't delete billons)
ALTER TABLE public.billons
  ADD CONSTRAINT billons_plot_id_fkey 
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE SET NULL;

-- 3) Reload PostgREST schema cache so the API sees the new column
NOTIFY pgrst, 'reload schema';
