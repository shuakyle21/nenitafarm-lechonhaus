-- Add daily_wage to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS daily_wage NUMERIC DEFAULT 0;

-- Add status and notes to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PRESENT'; -- 'PRESENT', 'ABSENT'
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update specific staff wages
UPDATE staff SET daily_wage = 350.00 WHERE name = 'Vina Castre';
UPDATE staff SET daily_wage = 300.00 WHERE name = 'Abbezzen Grace';
