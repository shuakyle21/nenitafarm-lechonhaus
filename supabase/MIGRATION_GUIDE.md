# Order Timestamp Migration Guide

## Overview

This guide explains how to fix existing orders that have incorrect timestamp formats in the database.

## The Problem

Previously, the `ReceiptModal` component was generating localized date strings (e.g., "12/7/2025, 11:09:00 AM") when saving orders to the database. When the database received these strings without timezone information, it interpreted them ambiguously, causing timezone-related issues:

- **Example**: An order placed at 11:09 AM Philippines Time (UTC+8)
  - Was saved as: `"12/7/2025, 11:09:00 AM"` (no timezone info)
  - Database interpreted it as: 11:09 AM UTC
  - When displayed back in Philippines Time: Showed as 7:09 PM (incorrect!)

For a detailed technical explanation, see [`TIMESTAMP_ISSUE_EXPLANATION.md`](TIMESTAMP_ISSUE_EXPLANATION.md).

## The Solution

The code has been fixed to use ISO 8601 format (`new Date().toISOString()`) for new orders. However, **existing orders** still have the incorrect format and need to be migrated.

## Pre-Migration: Diagnosis

**Before running any migration**, first check if you actually need it:

1. Run the diagnostic script: [`diagnose_timestamps.sql`](diagnose_timestamps.sql)
2. This will show you:
   - How many orders have incorrect format
   - Examples of the problematic data
   - Whether migration is needed

```sql
-- Run in Supabase SQL Editor
-- File: supabase/diagnose_timestamps.sql
```

If the diagnostic shows **0 orders need migration**, you're done! Otherwise, continue below.

## Migration Steps

### Prerequisites

1. **Backup your database** - This is critical!
   ```bash
   # If using Supabase CLI
   supabase db dump -f backup_before_timestamp_fix.sql
   
   # Or using pg_dump directly
   pg_dump your_database > backup_before_timestamp_fix.sql
   ```

2. **Access to Supabase SQL Editor** or PostgreSQL client

### Step 1: Review What Will Change

1. Open the Supabase SQL Editor (or connect via psql)
2. Run the migration script: `supabase/fix_order_timestamps.sql`
3. The script will first show you a preview of what will change:

```sql
-- This SELECT query shows:
-- - old_timestamp: Current format in database
-- - new_timestamp_utc: Corrected UTC timestamp
-- - new_timestamp_philippines: How it will display in local time
-- - status: Whether it will be changed
```

**Review this output carefully!** Verify that:
- Orders with localized format (e.g., "12/7/2025, 11:09:00 AM") are being converted
- The new Philippines time matches when the order was actually placed
- Orders already in ISO 8601 format are not being changed

### Step 2: Apply the Migration

If the preview looks correct:

1. Uncomment the transaction block in the script (lines starting with `/*` and ending with `*/`)
2. Run the uncommented section:

```sql
BEGIN;

UPDATE orders 
SET created_at = created_at_fixed 
WHERE created_at_fixed IS NOT NULL 
  AND created_at::TEXT != created_at_fixed::TEXT;

ALTER TABLE orders DROP COLUMN IF EXISTS created_at_fixed;
DROP FUNCTION IF EXISTS parse_localized_timestamp(TEXT);

COMMIT;
```

### Step 3: Verify the Results

Run the verification query:

```sql
SELECT 
    id,
    order_number,
    created_at,
    created_at AT TIME ZONE 'Asia/Manila' as philippines_time,
    created_at AT TIME ZONE 'UTC' as utc_time
FROM orders
ORDER BY created_at DESC
LIMIT 20;
```

Check that:
- Timestamps are now in ISO 8601 format (e.g., "2025-12-07T03:09:00+00:00")
- The `philippines_time` column shows the correct local time when orders were placed
- The "Today's Orders" feature in the app now works correctly

## Troubleshooting

### If times are still incorrect after migration

1. Check your server timezone settings
2. Verify the `AT TIME ZONE 'Asia/Manila'` conversion in the script is correct for your region
3. If you're in a different timezone, modify the script accordingly

### If you need to rollback

If you created a backup table before migration:

```sql
-- Restore from backup table
BEGIN;
DELETE FROM orders;
INSERT INTO orders SELECT * FROM orders_backup_before_timestamp_fix;
COMMIT;
```

Or restore from the SQL dump:

```bash
# Using Supabase CLI
supabase db reset

# Or using psql
psql your_database < backup_before_timestamp_fix.sql
```

## Understanding the Migration

The migration script:

1. **Detects** orders with localized format vs ISO 8601 format
2. **Parses** localized timestamps (e.g., "12/7/2025, 11:09:00 AM")
3. **Converts** them to UTC by treating the original time as Philippines Time (UTC+8)
4. **Stores** the result in proper ISO 8601 format
5. **Preserves** orders that are already in correct format

## Future Orders

After this migration, all new orders will automatically use ISO 8601 format because:
- The `ReceiptModal.tsx` component has been updated (line 57)
- New orders use `new Date().toISOString()` which generates proper timestamps
- No manual intervention will be needed for future orders

## Additional Notes

- This migration is **safe to run multiple times** - it only modifies orders with incorrect format
- The script uses a temporary column (`created_at_fixed`) to avoid data loss during conversion
- Already-correct timestamps are left unchanged
- The migration is timezone-aware and preserves the original local time intent

## Support

If you encounter issues:
1. Check the backup was created successfully
2. Review the preview output before applying
3. Test on a development/staging database first
4. Document any orders that seem incorrect after migration

## Quick Reference

### Files in this directory:

1. **`diagnose_timestamps.sql`** - Check if migration is needed (run this first!)
2. **`fix_order_timestamps.sql`** - Step-by-step migration with preview
3. **`fix_order_timestamps_auto.sql`** - Automated migration with backup
4. **`test_migration.sql`** - Test the migration logic (development only)
5. **`MIGRATION_GUIDE.md`** - This file
6. **`TIMESTAMP_ISSUE_EXPLANATION.md`** - Technical explanation of the issue

### Recommended Workflow:

```
1. diagnose_timestamps.sql  → Check if migration needed
2. Backup database          → Create safety net
3. fix_order_timestamps.sql → Review and apply changes
4. Verify results           → Check orders display correctly
```
