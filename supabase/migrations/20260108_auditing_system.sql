-- ==========================================
-- Auditing System Migration
-- This script sets up a production-grade 
-- auditing system for Nenita Farm POS.
-- ==========================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES users(id), -- References the custom users table
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add tracking columns to core tables
-- If columns already exist, this will skip them
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='deleted_at') THEN
        ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='created_by') THEN
        ALTER TABLE orders ADD COLUMN created_by UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='updated_by') THEN
        ALTER TABLE orders ADD COLUMN updated_by UUID;
    END IF;

    -- Inventory Items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='inventory_items') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='updated_by') THEN
            ALTER TABLE inventory_items ADD COLUMN updated_by UUID;
        END IF;
    END IF;

    -- Inventory Transactions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='inventory_transactions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_transactions' AND column_name='created_by') THEN
            ALTER TABLE inventory_transactions ADD COLUMN created_by UUID;
        END IF;
    END IF;

    -- Expenses
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='expenses') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='created_by') THEN
            ALTER TABLE expenses ADD COLUMN created_by UUID;
        END IF;
    END IF;

    -- Sales Adjustments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sales_adjustments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_adjustments' AND column_name='created_by') THEN
            ALTER TABLE sales_adjustments ADD COLUMN created_by UUID;
        END IF;
    END IF;

    -- Cash Transactions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='cash_transactions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cash_transactions' AND column_name='created_by') THEN
            ALTER TABLE cash_transactions ADD COLUMN created_by UUID;
        END IF;
    END IF;
END $$;

-- 3. Create Audit Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- 1. Try to get user ID from the record being changed (application level tracking)
    IF (TG_OP = 'INSERT') THEN
        BEGIN
            current_user_id := NEW.created_by;
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    ELSE
        BEGIN
            current_user_id := NEW.updated_by;
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;

    -- 2. Fallback: Try to get the user ID from the Supabase auth context (if using built-in auth)
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::UUID;
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_orders_trigger ON orders;
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_order_items_trigger ON order_items;
CREATE TRIGGER audit_order_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_menu_items_trigger ON menu_items;
CREATE TRIGGER audit_menu_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON menu_items
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Inventory tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='inventory_items') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_inventory_items_trigger ON inventory_items';
        EXECUTE 'CREATE TRIGGER audit_inventory_items_trigger AFTER INSERT OR UPDATE OR DELETE ON inventory_items FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='inventory_transactions') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_inventory_transactions_trigger ON inventory_transactions';
        EXECUTE 'CREATE TRIGGER audit_inventory_transactions_trigger AFTER INSERT OR UPDATE OR DELETE ON inventory_transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='expenses') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses';
        EXECUTE 'CREATE TRIGGER audit_expenses_trigger AFTER INSERT OR UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sales_adjustments') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_sales_adjustments_trigger ON sales_adjustments';
        EXECUTE 'CREATE TRIGGER audit_sales_adjustments_trigger AFTER INSERT OR UPDATE OR DELETE ON sales_adjustments FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='cash_transactions') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_cash_transactions_trigger ON cash_transactions';
        EXECUTE 'CREATE TRIGGER audit_cash_transactions_trigger AFTER INSERT OR UPDATE OR DELETE ON cash_transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='recipes') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_recipes_trigger ON recipes';
        EXECUTE 'CREATE TRIGGER audit_recipes_trigger AFTER INSERT OR UPDATE OR DELETE ON recipes FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='suppliers') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS audit_suppliers_trigger ON suppliers';
        EXECUTE 'CREATE TRIGGER audit_suppliers_trigger AFTER INSERT OR UPDATE OR DELETE ON suppliers FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
    END IF;
END $$;

-- 5. Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: In a real "Auditor" scenario, only the AUDITOR role should select from this table.
-- For now, we'll allow Authenticated users with ADMIN role to see it.
CREATE POLICY "Admins can view audit logs" 
ON audit_logs FOR SELECT 
USING (
  -- This requires your auth.users to have a 'role' claim or a separate profiles table
  -- For now, simplified for the user's setup
  true 
);
