-- Update "Lechon" to be a weighted item
-- This will trigger the LechonModal in the POS, allowing custom weight/price input.
UPDATE menu_items 
SET is_weighted = true 
WHERE name = 'Lechon';
