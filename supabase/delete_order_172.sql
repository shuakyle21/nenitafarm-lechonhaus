-- Script to delete Order #172 and reset the sequence
-- Run this in the Supabase SQL Editor

BEGIN;

-- 1. Delete the specific order
-- The trigger for order_items (ON DELETE CASCADE) should handle the items if set up correctly,
-- but we'll stick to deleting the order parent row.
DELETE FROM orders 
WHERE order_number = 172;

-- 2. Reset the sequence to the current maximum value
-- If you just deleted the latest order (172), the max will be 171.
-- Setting the val to 171 means the *next* value generated will be 172.
SELECT setval('orders_order_number_seq', COALESCE((SELECT MAX(order_number) FROM orders), 0));

COMMIT;
