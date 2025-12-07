-- ================================================================================
-- Migration Script: Fix Order Timestamps
-- ================================================================================
-- 
-- PURPOSE:
-- This script fixes existing orders that have incorrect timestamp formats.
-- 
-- THE PROBLEM:
-- Orders were saved with localized date strings (e.g., "12/7/2025, 11:09:00 AM")
-- which were interpreted as UTC when stored in the database, causing timezone 
-- confusion. For example:
-- - Order placed at 11:09 AM Philippines Time (UTC+8)
-- - Saved as "12/7/2025, 11:09:00 AM" without timezone info
-- - Database interpreted this as 11:09 AM UTC
-- - When displayed in Philippines Time, it showed as 7:09 PM (8 hours ahead)
-- 
-- THE SOLUTION:
-- Convert localized timestamps to proper ISO 8601 format by:
-- 1. Detecting orders with localized format
-- 2. Parsing the localized time and treating it as Philippines Time (UTC+8)
-- 3. Converting to proper UTC for storage
-- 
-- ASSUMPTIONS:
-- - Original timestamps were in Philippines Time (UTC+8)
-- - Localized format is "M/D/YYYY, H:MM:SS AM/PM" (en-PH format)
-- 
-- IMPORTANT: Always backup your database before running migrations!
-- Example: pg_dump your_database > backup_before_timestamp_fix.sql
-- ================================================================================

-- Step 1: Create a backup table (recommended for safety)
-- Uncomment to create a backup:
-- CREATE TABLE orders_backup_before_timestamp_fix AS SELECT * FROM orders;

-- Step 2: Add a temporary column to store the corrected timestamp
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at_fixed TIMESTAMPTZ;

-- Step 3: Create a function to parse localized date strings
CREATE OR REPLACE FUNCTION parse_localized_timestamp(date_str TEXT)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    result TIMESTAMPTZ;
BEGIN
    -- Try to parse the localized format and convert to UTC
    -- The string is in Philippines Time (UTC+8), so we subtract 8 hours
    BEGIN
        -- Handle format: "12/7/2025, 11:09:00 AM"
        result := TO_TIMESTAMP(date_str, 'MM/DD/YYYY, HH12:MI:SS AM') AT TIME ZONE 'Asia/Manila' AT TIME ZONE 'UTC';
        RETURN result;
    EXCEPTION
        WHEN OTHERS THEN
            -- If parsing fails, return NULL
            RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update the fixed column with corrected timestamps
UPDATE orders 
SET created_at_fixed = CASE
    -- Case 1: Already in ISO 8601 format (contains 'T' and 'Z' or timezone offset)
    WHEN created_at::TEXT LIKE '%T%Z%' OR created_at::TEXT LIKE '%T%+%' OR created_at::TEXT LIKE '%T%-__:__' THEN 
        created_at
    
    -- Case 2: Already in standard PostgreSQL timestamp format (YYYY-MM-DD)
    WHEN created_at::TEXT ~ '^\d{4}-\d{2}-\d{2}' THEN 
        created_at
    
    -- Case 3: Localized format needs conversion
    WHEN created_at::TEXT ~ '^\d{1,2}/\d{1,2}/\d{4},' THEN
        parse_localized_timestamp(created_at::TEXT)
    
    -- Case 4: Unknown format - keep original
    ELSE 
        created_at
END;

-- Step 5: View what will be changed (REVIEW THIS BEFORE APPLYING!)
SELECT 
    id,
    order_number,
    created_at::TEXT as old_timestamp,
    created_at_fixed::TEXT as new_timestamp_utc,
    (created_at_fixed AT TIME ZONE 'Asia/Manila')::TEXT as new_timestamp_philippines,
    CASE 
        WHEN created_at::TEXT != created_at_fixed::TEXT THEN '✓ WILL BE FIXED'
        ELSE '○ No change needed'
    END as status,
    CASE 
        WHEN created_at::TEXT ~ '^\d{1,2}/\d{1,2}/\d{4},' THEN 'Localized Format'
        WHEN created_at::TEXT LIKE '%T%Z%' THEN 'ISO 8601 Format'
        ELSE 'Other Format'
    END as detected_format
FROM orders
ORDER BY created_at;

-- ================================================================================
-- IMPORTANT: Review the SELECT query results above before proceeding!
-- ================================================================================

-- Step 6: Apply the fix (UNCOMMENT AFTER VERIFICATION)
-- Once you've verified the results above are correct, uncomment and run:

/*
BEGIN;

-- Apply the fix
UPDATE orders 
SET created_at = created_at_fixed 
WHERE created_at_fixed IS NOT NULL 
  AND created_at::TEXT != created_at_fixed::TEXT;

-- Clean up temporary column
ALTER TABLE orders DROP COLUMN IF EXISTS created_at_fixed;

-- Clean up the helper function
DROP FUNCTION IF EXISTS parse_localized_timestamp(TEXT);

COMMIT;

-- Verify the results
SELECT 
    id,
    order_number,
    created_at,
    created_at AT TIME ZONE 'Asia/Manila' as philippines_time,
    created_at AT TIME ZONE 'UTC' as utc_time
FROM orders
ORDER BY created_at DESC
LIMIT 20;
*/

-- ================================================================================
-- Post-Migration Notes:
-- ================================================================================
-- After running this migration:
-- 1. New orders will be saved with proper ISO 8601 format (already fixed in code)
-- 2. Old orders will now display the correct local time
-- 3. The "Today's Orders" filter will work correctly
-- 
-- If you need to restore from backup:
-- - Use the backup table: INSERT INTO orders SELECT * FROM orders_backup_before_timestamp_fix;
-- ================================================================================
