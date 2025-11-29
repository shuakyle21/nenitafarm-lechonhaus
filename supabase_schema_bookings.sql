-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  pax INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CATERING', 'RESERVATION')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (since we don't have auth fully set up for staff yet)
CREATE POLICY "Enable all access for all users" ON bookings FOR ALL USING (true) WITH CHECK (true);
