-- ============================================================
-- BILLONS CYCLE DECOUPLING — Migration
-- Makes plot_id nullable and sets ON DELETE SET NULL
-- Run in Supabase SQL Editor
-- ============================================================

-- 1) Drop foreign keys and NOT NULL constraint for billons
alter table public.billons
  drop constraint if exists billons_plot_id_fkey;

alter table public.billons
  alter column plot_id drop not null;

alter table public.billons
  add constraint billons_plot_id_fkey 
  foreign key (plot_id) references public.plots(id) on delete set null;

-- Remove unique(plot_id, billon_number) since plot_id can be null.
-- We still might want billon_number to just be unique within a plot, but with nulls we might rely on the app logic.
alter table public.billons
  drop constraint if exists billons_plot_id_billon_number_key;

-- 2) Drop foreign keys and NOT NULL constraint for billon_cycle_history
alter table public.billon_cycle_history
  drop constraint if exists billon_cycle_history_plot_id_fkey;

alter table public.billon_cycle_history
  alter column plot_id drop not null;

alter table public.billon_cycle_history
  add constraint billon_cycle_history_plot_id_fkey 
  foreign key (plot_id) references public.plots(id) on delete set null;
