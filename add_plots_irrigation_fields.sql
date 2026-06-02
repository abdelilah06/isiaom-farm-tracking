-- MIGRATION TO ADD IRRIGATION FIELD SPECIFICATIONS TO PLOTS
-- Run this script in your Supabase SQL Editor

ALTER TABLE public.plots 
ADD COLUMN IF NOT EXISTS dripper_flow_rate_lh numeric DEFAULT 4,
ADD COLUMN IF NOT EXISTS irrigation_lines integer DEFAULT 1;

COMMENT ON COLUMN public.plots.dripper_flow_rate_lh IS 'Flow rate per emitter/dripper in Liters per hour';
COMMENT ON COLUMN public.plots.irrigation_lines IS 'Number of irrigation lines (e.g. 1 or 2)';
