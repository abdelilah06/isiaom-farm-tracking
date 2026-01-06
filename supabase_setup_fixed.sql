-- SAFE COMPREHENSIVE SCHEMA UPDATE
-- This script uses guard clauses to prevent errors if columns already exist or are missing

DO $$ 
BEGIN
    -- 1. FIX PLOTS TABLE
    -- Rename area_sqm to area if area_sqm exists and area does NOT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'area_sqm') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'area') THEN
        ALTER TABLE public.plots RENAME COLUMN area_sqm TO area;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'area') THEN
        ALTER TABLE public.plots ADD COLUMN area numeric;
    END IF;

    -- Rename crop_type to crop_variety if crop_type exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'crop_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'crop_variety') THEN
        ALTER TABLE public.plots RENAME COLUMN crop_type TO crop_variety;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'crop_variety') THEN
        ALTER TABLE public.plots ADD COLUMN crop_variety text;
    END IF;

    -- Add missing columns to plots
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'irrigation_system') THEN
        ALTER TABLE public.plots ADD COLUMN irrigation_system text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'rootstock') THEN
        ALTER TABLE public.plots ADD COLUMN rootstock text;
    END IF;

    -- Adjust plots.id to text (to handle manual string IDs)
    ALTER TABLE public.plots ALTER COLUMN id TYPE text;

    -- 2. FIX OPERATIONS TABLE
    -- Rename operation_type to type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operations' AND column_name = 'operation_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operations' AND column_name = 'type') THEN
        ALTER TABLE public.operations RENAME COLUMN operation_type TO type;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operations' AND column_name = 'type') THEN
        ALTER TABLE public.operations ADD COLUMN type text;
    END IF;

    -- Rename performed_at to date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operations' AND column_name = 'performed_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operations' AND column_name = 'date') THEN
        ALTER TABLE public.operations RENAME COLUMN performed_at TO date;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operations' AND column_name = 'date') THEN
        ALTER TABLE public.operations ADD COLUMN date timestamp with time zone DEFAULT now();
    END IF;

    -- Adjust operations.plot_id
    ALTER TABLE public.operations ALTER COLUMN plot_id TYPE text;

END $$;

-- 3. CREATE MISSING TABLES (These use IF NOT EXISTS natively)

-- TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  task_type text NOT NULL,
  due_date timestamp with time zone NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  plot_id text REFERENCES public.plots(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- YIELD RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.yield_records (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  plot_id text REFERENCES public.plots(id) ON DELETE CASCADE,
  harvest_date date NOT NULL,
  quantity_kg numeric NOT NULL,
  quality_grade text,
  notes text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. ENABLE RLS & POLICIES (Handled with check to avoid errors)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_records ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they are up to date
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON tasks;
CREATE POLICY "Tasks are viewable by everyone" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage tasks" ON tasks;
CREATE POLICY "Staff can manage tasks" ON tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND role IN ('admin', 'manager', 'worker')
  )
);

DROP POLICY IF EXISTS "Yield records are viewable by everyone" ON yield_records;
CREATE POLICY "Yield records are viewable by everyone" ON yield_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage yield" ON yield_records;
CREATE POLICY "Staff can manage yield" ON yield_records FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND role IN ('admin', 'manager')
  )
);
