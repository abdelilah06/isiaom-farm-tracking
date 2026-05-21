-- =========================================================================
-- DATABASE SCHEMA UPDATE V5 — Drop and Update Operation/Activity Constraints
-- Safe, idempotent execution for Supabase SQL Editor.
-- =========================================================================

-- 1. UPDATE BILLON ACTIVITIES CONSTRAINT
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Dynamically find and drop any existing check constraints on billon_activities.activity_type
    FOR r IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class cl ON cl.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = cl.relnamespace
        WHERE ns.nspname = 'public'
          AND cl.relname = 'billon_activities'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%activity_type%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.billon_activities DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Apply the updated, expanded constraint supporting 7 options (including pest_control and observation)
ALTER TABLE public.billon_activities
  ADD CONSTRAINT billon_activities_activity_type_check
  CHECK (activity_type IN ('irrigation', 'fertilization', 'pest_control', 'planting', 'harvest', 'observation', 'other'));

-- 2. UPDATE OPERATIONS CONSTRAINT
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Dynamically find and drop any check constraints on operations for 'type' or 'operation_type'
    FOR r IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class cl ON cl.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = cl.relnamespace
        WHERE ns.nspname = 'public'
          AND cl.relname = 'operations'
          AND con.contype = 'c'
          AND (pg_get_constraintdef(con.oid) LIKE '%type%' OR pg_get_constraintdef(con.oid) LIKE '%operation_type%')
    ) LOOP
        EXECUTE 'ALTER TABLE public.operations DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Apply the updated, expanded constraint supporting 8 options (including pest_control and observation)
ALTER TABLE public.operations
  ADD CONSTRAINT operations_type_check
  CHECK (type IN ('irrigation', 'fertilization', 'pest_control', 'pruning', 'harvest', 'observation', 'planting', 'other'));

-- 3. VERIFICATION QUERY (RUN THIS TO CHECK IF SCHEMA IS CORRECT)
SELECT 
    cl.relname AS table_name,
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class cl ON cl.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
WHERE ns.nspname = 'public'
  AND cl.relname IN ('billon_activities', 'operations')
  AND con.contype = 'c';
