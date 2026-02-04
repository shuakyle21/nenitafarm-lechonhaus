-- ================================================================================
-- AUTOMATED Order Timestamp Fix (One-Step Migration)
-- ================================================================================
-- 
-- This is a simplified version that automatically fixes the timestamps.
-- For a step-by-step version with previews, use fix_order_timestamps.sql
-- 
-- IMPORTANT: This will modify your data. Backup first!
-- ================================================================================

DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Create backup table
    RAISE NOTICE 'Creating backup table...';
    DROP TABLE IF EXISTS orders_backup_before_timestamp_fix;
    CREATE TABLE orders_backup_before_timestamp_fix AS SELECT * FROM orders;
    RAISE NOTICE 'Backup created: orders_backup_before_timestamp_fix';

    -- Create helper function
    CREATE OR REPLACE FUNCTION parse_localized_timestamp(date_str TEXT)
    RETURNS TIMESTAMPTZ AS $func$
    DECLARE
        result TIMESTAMPTZ;
    BEGIN
        BEGIN
            result := TO_TIMESTAMP(date_str, 'MM/DD/YYYY, HH12:MI:SS AM') AT TIME ZONE 'Asia/Manila' AT TIME ZONE 'UTC';
            RETURN result;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN NULL;
        END;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Add temporary column
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at_fixed TIMESTAMPTZ;
    
    -- Update timestamps
    RAISE NOTICE 'Converting timestamps...';
    UPDATE orders 
    SET created_at_fixed = CASE
        WHEN created_at::TEXT LIKE '%T%Z%' OR created_at::TEXT LIKE '%T%+%' OR created_at::TEXT LIKE '%T%-__:__' THEN 
            created_at
        WHEN created_at::TEXT ~ '^\d{4}-\d{2}-\d{2}' THEN 
            created_at
        WHEN created_at::TEXT ~ '^\d{1,2}/\d{1,2}/\d{4},' THEN
            parse_localized_timestamp(created_at::TEXT)
        ELSE 
            created_at
    END;
    
    -- Count affected rows
    SELECT COUNT(*) INTO affected_rows
    FROM orders
    WHERE created_at::TEXT != created_at_fixed::TEXT;
    
    RAISE NOTICE 'Found % orders with incorrect timestamp format', affected_rows;
    
    -- Apply the fix
    UPDATE orders 
    SET created_at = created_at_fixed 
    WHERE created_at_fixed IS NOT NULL 
      AND created_at::TEXT != created_at_fixed::TEXT;
    
    RAISE NOTICE 'Updated % orders', affected_rows;
    
    -- Cleanup
    ALTER TABLE orders DROP COLUMN IF EXISTS created_at_fixed;
    DROP FUNCTION IF EXISTS parse_localized_timestamp(TEXT);
    
    -- Show results
    RAISE NOTICE 'Migration complete! Showing recent orders:';
    
    -- Return summary
    RAISE NOTICE '---';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Backup table: orders_backup_before_timestamp_fix';
    RAISE NOTICE '  - Orders fixed: %', affected_rows;
    RAISE NOTICE '  - To restore: DELETE FROM orders; INSERT INTO orders SELECT * FROM orders_backup_before_timestamp_fix;';
    RAISE NOTICE '---';
END $$;

-- Verify the results
SELECT 
    order_number,
    created_at as utc_time,
    created_at AT TIME ZONE 'Asia/Manila' as philippines_time
FROM orders
ORDER BY created_at DESC
LIMIT 10;
