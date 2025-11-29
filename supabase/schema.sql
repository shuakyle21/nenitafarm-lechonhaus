-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
  payment_method TEXT, -- cash, gcash
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price_at_time NUMERIC NOT NULL, -- Store price at time of order to handle price changes
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies (For simplicity in this initial setup, we'll allow public access. 
-- IN PRODUCTION, YOU SHOULD RESTRICT THIS!)

-- Menu Items: Public read, Authenticated (or specific role) write
CREATE POLICY "Public menu items are viewable by everyone" 
ON menu_items FOR SELECT USING (true);

CREATE POLICY "Menu items are insertable by everyone (DEMO ONLY)" 
ON menu_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Menu items are updatable by everyone (DEMO ONLY)" 
ON menu_items FOR UPDATE USING (true);

CREATE POLICY "Menu items are deletable by everyone (DEMO ONLY)" 
ON menu_items FOR DELETE USING (true);


-- Orders: Public read/write (DEMO ONLY)
CREATE POLICY "Orders are viewable by everyone" 
ON orders FOR SELECT USING (true);

CREATE POLICY "Orders are insertable by everyone" 
ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders are updatable by everyone" 
ON orders FOR UPDATE USING (true);


-- Order Items: Public read/write (DEMO ONLY)
CREATE POLICY "Order items are viewable by everyone" 
ON order_items FOR SELECT USING (true);

CREATE POLICY "Order items are insertable by everyone" 
ON order_items FOR INSERT WITH CHECK (true);
