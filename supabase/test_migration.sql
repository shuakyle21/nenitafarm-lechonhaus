-- ================================================================================
-- Test Script for Order Timestamp Migration
-- ================================================================================
-- This script creates sample data to test the migration logic
-- Run this in a test/development database, NOT in production!
-- ================================================================================

-- Create a test table (TEXT column to simulate the actual issue)
DROP TABLE IF EXISTS orders_test;
CREATE TABLE orders_test (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number INTEGER,
    created_at TEXT,  -- Using TEXT to simulate the actual problematic data
    description TEXT
);

-- Insert test data with various timestamp formats
-- 1. Localized format (the problem format) - as stored when using toLocaleString()
INSERT INTO orders_test (order_number, created_at, description) 
VALUES 
    (201, '12/7/2025, 11:09:00 AM', 'Localized format - 11:09 AM'),
    (202, '12/7/2025, 3:30:00 PM', 'Localized format - 3:30 PM'),
    (203, '12/6/2025, 9:15:00 AM', 'Localized format - previous day'),
    (204, '1/5/2025, 8:00:00 AM', 'Localized format - single digit month/day');

-- 2. ISO 8601 format (correct format - should not be changed)
INSERT INTO orders_test (order_number, created_at, description) 
VALUES 
    (205, '2025-12-07T03:09:00.000Z', 'ISO 8601 format - already correct'),
    (206, '2025-12-07T07:30:00.000Z', 'ISO 8601 format - already correct');

-- 3. Standard PostgreSQL timestamp format (should not be changed)
INSERT INTO orders_test (order_number, created_at, description) 
VALUES 
    (207, '2025-12-07 11:09:00+08', 'PostgreSQL format with timezone'),
    (208, '2025-12-07 15:30:00+08', 'PostgreSQL format with timezone');

-- Display the test data
RAISE NOTICE 'Original test data:';
SELECT 
    order_number,
    created_at as timestamp_text,
    description
FROM orders_test
ORDER BY order_number;

-- Now test the migration logic
RAISE NOTICE '';
RAISE NOTICE 'Running migration logic...';

-- Add temporary column
ALTER TABLE orders_test ADD COLUMN IF NOT EXISTS created_at_fixed TEXT;

-- Create the helper function
CREATE OR REPLACE FUNCTION parse_localized_timestamp_test(date_str TEXT)
RETURNS TEXT AS $$
DECLARE
    result TIMESTAMPTZ;
BEGIN
    BEGIN
        -- Parse the localized string and convert to ISO 8601
        result := TO_TIMESTAMP(date_str, 'MM/DD/YYYY, HH12:MI:SS AM') AT TIME ZONE 'Asia/Manila' AT TIME ZONE 'UTC';
        RETURN result::TEXT;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Apply the conversion logic (matching the actual migration script)
UPDATE orders_test 
SET created_at_fixed = CASE
    -- Already in ISO 8601 format
    WHEN created_at LIKE '%T%Z%' OR created_at LIKE '%T%+%' OR created_at LIKE '%T%-__:__' THEN 
        created_at
    -- Already in standard PostgreSQL format
    WHEN created_at ~ '^\d{4}-\d{2}-\d{2}' THEN 
        created_at
    -- Localized format needs conversion
    WHEN created_at ~ '^\d{1,2}/\d{1,2}/\d{4},' THEN
        parse_localized_timestamp_test(created_at)
    -- Unknown format
    ELSE 
        created_at
END;

-- Show the results
RAISE NOTICE '';
RAISE NOTICE 'Migration Results:';
SELECT 
    order_number,
    description,
    created_at as old_format,
    created_at_fixed as new_format_utc,
    -- Show what it would look like in Philippines time
    (created_at_fixed::TIMESTAMPTZ AT TIME ZONE 'Asia/Manila')::TEXT as new_format_philippines,
    CASE 
        WHEN created_at != created_at_fixed THEN '✓ CHANGED'
        ELSE '○ Unchanged'
    END as status,
    CASE 
        WHEN created_at ~ '^\d{1,2}/\d{1,2}/\d{4},' THEN 'Localized'
        WHEN created_at LIKE '%T%Z%' THEN 'ISO 8601'
        WHEN created_at ~ '^\d{4}-\d{2}-\d{2}.*\+' THEN 'PostgreSQL+TZ'
        ELSE 'Other'
    END as detected_format
FROM orders_test
ORDER BY order_number;

RAISE NOTICE '';
RAISE NOTICE 'Verification:';
RAISE NOTICE 'Check that:';
RAISE NOTICE '  1. Orders 201-204 (localized) show status = ✓ CHANGED';
RAISE NOTICE '  2. Orders 205-208 (already correct) show status = ○ Unchanged';
RAISE NOTICE '  3. new_format_philippines matches the original time (e.g., 11:09 AM still shows as 11:09)';

-- Cleanup
DROP FUNCTION IF EXISTS parse_localized_timestamp_test(TEXT);
DROP TABLE IF EXISTS orders_test;

RAISE NOTICE '';
RAISE NOTICE 'Test complete. Table and function cleaned up.';

-- ================================================================================
-- Expected Results:
-- ================================================================================
-- Orders 201-204 (localized format) should be CHANGED
--   - "12/7/2025, 11:09:00 AM" → "2025-12-07 03:09:00+00" (UTC)
--   - philippines_time should show: "2025-12-07 11:09:00" (matches original intent)
-- 
-- Orders 205-208 (ISO 8601 or PostgreSQL) should be Unchanged
--   - Already in correct format
-- 
-- The key test: Does "11:09:00 AM" Philippines time convert to "03:09:00+00" UTC?
-- This is correct because Philippines is UTC+8, so 11:09 AM local = 03:09 AM UTC
-- ================================================================================
