-- Create paper_pos_imports table to store imported paper records
CREATE TABLE IF NOT EXISTS paper_pos_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  items TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'CASH',
  order_type TEXT DEFAULT 'DINE_IN',
  notes TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  imported_by TEXT,
  synced BOOLEAN DEFAULT false,
  synced_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE paper_pos_imports ENABLE ROW LEVEL SECURITY;

-- Create policies for paper_pos_imports
CREATE POLICY "Paper POS imports are viewable by everyone" 
ON paper_pos_imports FOR SELECT USING (true);

CREATE POLICY "Paper POS imports are insertable by everyone" 
ON paper_pos_imports FOR INSERT WITH CHECK (true);

CREATE POLICY "Paper POS imports are updatable by everyone" 
ON paper_pos_imports FOR UPDATE USING (true);

CREATE POLICY "Paper POS imports are deletable by everyone" 
ON paper_pos_imports FOR DELETE USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_paper_pos_imports_synced ON paper_pos_imports(synced);
CREATE INDEX IF NOT EXISTS idx_paper_pos_imports_date ON paper_pos_imports(date);
