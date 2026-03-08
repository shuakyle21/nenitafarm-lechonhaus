-- ================================================================================
-- Diagnostic Script: Check Order Timestamp Formats
-- ================================================================================
-- Run this first to understand what timestamp formats exist in your database
-- This will help you determine if migration is needed
-- ================================================================================

-- Count orders by timestamp format
WITH format_analysis AS (
    SELECT 
        id,
        order_number,
        created_at,
        created_at::TEXT as timestamp_text,
        CASE 
            -- ISO 8601 format (good)
            WHEN created_at::TEXT ~ '^\d{4}-\d{2}-\d{2}T.*Z$' THEN 'ISO 8601 (Correct)'
            -- PostgreSQL TIMESTAMPTZ with timezone
            WHEN created_at::TEXT ~ '^\d{4}-\d{2}-\d{2}.*[\+\-]\d{2}' THEN 'PostgreSQL+TZ (OK)'
            -- Localized format (problematic)
            WHEN created_at::TEXT ~ '^\d{1,2}/\d{1,2}/\d{4},' THEN 'Localized (NEEDS FIX)'
            -- Standard PostgreSQL timestamp
            WHEN created_at::TEXT ~ '^\d{4}-\d{2}-\d{2}' THEN 'PostgreSQL (OK)'
            ELSE 'Unknown Format'
        END as format_type
    FROM orders
)
SELECT 
    format_type,
    COUNT(*) as order_count,
    MIN(timestamp_text) as example_format
FROM format_analysis
GROUP BY format_type
ORDER BY order_count DESC;

-- Show sample orders that need fixing
SELECT 
    order_number,
    created_at,
    created_at::TEXT as stored_format,
    created_at AT TIME ZONE 'UTC' as utc_time,
    created_at AT TIME ZONE 'Asia/Manila' as philippines_time,
    CASE 
        WHEN created_at::TEXT ~ '^\d{1,2}/\d{1,2}/\d{4},' THEN '⚠️ NEEDS MIGRATION'
        ELSE '✓ OK'
    END as status
FROM orders
WHERE created_at::TEXT ~ '^\d{1,2}/\d{1,2}/\d{4},'
ORDER BY created_at DESC
LIMIT 10;

-- Summary
DO $$
DECLARE
    needs_fix_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO needs_fix_count
    FROM orders
    WHERE created_at::TEXT ~ '^\d{1,2}/\d{1,2}/\d{4},';
    
    SELECT COUNT(*) INTO total_count
    FROM orders;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DIAGNOSTIC SUMMARY ===';
    RAISE NOTICE 'Total Orders: %', total_count;
    RAISE NOTICE 'Orders Needing Migration: %', needs_fix_count;
    
    IF needs_fix_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'ACTION REQUIRED:';
        RAISE NOTICE '  Run fix_order_timestamps.sql (step-by-step)';
        RAISE NOTICE '  OR fix_order_timestamps_auto.sql (automated)';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'All orders have correct timestamp format! ✓';
        RAISE NOTICE 'No migration needed.';
    END IF;
    RAISE NOTICE '========================';
END $$;
