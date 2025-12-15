-- Add DELETE policy for orders
-- This allows users to delete orders. In a real app, you might want to restrict this to admins.
-- But based on your current schema using "USING (true)", we'll follow that pattern.

CREATE POLICY "Orders are deletable by everyone" 
ON orders FOR DELETE USING (true);

-- Add DELETE policy for order_items
-- This is required for cascade deletes to work if RLS is enabled.

CREATE POLICY "Order items are deletable by everyone" 
ON order_items FOR DELETE USING (true);
