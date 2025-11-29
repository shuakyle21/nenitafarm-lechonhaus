-- Add variants column to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS variants JSONB;

-- Example variant structure:
-- [{"name": "Small", "price": 750}, {"name": "Medium", "price": 850}, {"name": "Large", "price": 1200}]
