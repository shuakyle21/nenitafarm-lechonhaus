-- Add missing columns to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_weighted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing columns to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_details JSONB,
ADD COLUMN IF NOT EXISTS cash NUMERIC,
ADD COLUMN IF NOT EXISTS change NUMERIC;
