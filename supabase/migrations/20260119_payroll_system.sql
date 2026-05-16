-- Create staff_transactions table
CREATE TABLE IF NOT EXISTS staff_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ADVANCE', 'PAYMENT', 'SALARY_PAYOUT')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_transactions_staff_id ON staff_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_transactions_date ON staff_transactions(date);

-- Enable RLS
ALTER TABLE staff_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy (allow authenticated users to manage transactions for now, or match project patterns)
CREATE POLICY "Enable all for authenticated users" ON staff_transactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
