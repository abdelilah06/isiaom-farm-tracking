-- =========================================================================
-- DATABASE SCHEMA UPDATE V6 — Structured Operations & Activities Metadata
-- Safe, idempotent execution for Supabase SQL Editor.
-- =========================================================================

-- 1. ADD 'metadata' JSONB COLUMN TO 'operations' TABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'operations' 
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.operations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        COMMENT ON COLUMN public.operations.metadata IS 'Structured data for operations (irrigation, fertilization, pest control)';
    END IF;
END $$;

-- 2. ADD 'metadata' JSONB COLUMN TO 'billon_activities' TABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'billon_activities' 
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.billon_activities ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        COMMENT ON COLUMN public.billon_activities.metadata IS 'Structured data for billon activities (irrigation, fertilization, pest control)';
    END IF;
END $$;

-- 3. CREATE GIN INDEXES FOR FAST METADATA QUERIES AND FILTERING
CREATE INDEX IF NOT EXISTS idx_operations_metadata_gin 
    ON public.operations USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_billon_activities_metadata_gin 
    ON public.billon_activities USING gin (metadata);

-- 4. MIGRATE EXISTING JSON STRINGS FROM 'notes' INTO 'metadata' COLUMN
-- For operations table:
DO $$
DECLARE
    r RECORD;
    parsed_json JSONB;
    human_notes TEXT;
BEGIN
    FOR r IN 
        SELECT id, notes 
        FROM public.operations 
        WHERE notes IS NOT NULL 
          AND notes LIKE '{"is_structured_%'
          AND (metadata IS NULL OR metadata = '{}'::jsonb)
    LOOP
        BEGIN
            parsed_json := r.notes::jsonb;
            human_notes := NULLIF(TRIM(parsed_json->>'notes'), '');
            
            UPDATE public.operations
            SET metadata = parsed_json,
                notes = human_notes
            WHERE id = r.id;
        EXCEPTION WHEN OTHERS THEN
            -- Skip corrupted notes without failing the entire migration
            RAISE NOTICE 'Skipping operation id % due to parsing error: %', r.id, SQLERRM;
        END;
    END LOOP;
END $$;

-- For billon_activities table:
DO $$
DECLARE
    r RECORD;
    parsed_json JSONB;
    human_notes TEXT;
BEGIN
    FOR r IN 
        SELECT id, notes 
        FROM public.billon_activities 
        WHERE notes IS NOT NULL 
          AND notes LIKE '{"is_structured_%'
          AND (metadata IS NULL OR metadata = '{}'::jsonb)
    LOOP
        BEGIN
            parsed_json := r.notes::jsonb;
            human_notes := NULLIF(TRIM(parsed_json->>'notes'), '');
            
            UPDATE public.billon_activities
            SET metadata = parsed_json,
                notes = human_notes
            WHERE id = r.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping billon_activity id % due to parsing error: %', r.id, SQLERRM;
        END;
    END LOOP;
END $$;

-- 5. RELOAD POSTGREST SCHEMA CACHE SO SUPABASE RECOGNIZES THE COLUMNS IMMEDIATELY
NOTIFY pgrst, 'reload schema';
