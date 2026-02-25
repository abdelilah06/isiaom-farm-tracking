-- ============================================================
-- ISIAOM RLS Security Fix — Run in Supabase SQL Editor
-- ============================================================

-- 1. ADD DELETE POLICIES FOR PLOTS (Admin only)
DROP POLICY IF EXISTS "Admin can delete plots" ON plots;
CREATE POLICY "Admin can delete plots" ON plots FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND role = 'admin'
  )
);

-- 2. ADD DELETE POLICIES FOR OPERATIONS (Staff)
DROP POLICY IF EXISTS "Staff can delete operations" ON operations;
CREATE POLICY "Staff can delete operations" ON operations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- 3. ADD DELETE POLICIES FOR TASKS (Staff)
DROP POLICY IF EXISTS "Staff can delete tasks" ON tasks;
CREATE POLICY "Staff can delete tasks" ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND role IN ('admin', 'manager', 'worker')
  )
);

-- 4. ADD DELETE POLICIES FOR YIELD_RECORDS (Admin/Manager)
DROP POLICY IF EXISTS "Staff can delete yield records" ON yield_records;
CREATE POLICY "Staff can delete yield records" ON yield_records FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- 5. ADD DELETE FOR DISEASE_LOGS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'disease_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Staff can delete disease logs" ON disease_logs';
    EXECUTE 'CREATE POLICY "Staff can delete disease logs" ON disease_logs FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role IN (''admin'', ''manager'')))';
  END IF;
END $$;

-- 6. ADD DELETE FOR PLOT_PHOTOS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plot_photos') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Staff can delete plot photos" ON plot_photos';
    EXECUTE 'CREATE POLICY "Staff can delete plot photos" ON plot_photos FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role IN (''admin'', ''manager'')))';
  END IF;
END $$;

-- ============================================================
-- VERIFICATION: List all policies to confirm
-- ============================================================
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
