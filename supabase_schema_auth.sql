-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CASHIER')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role
  FROM users u
  WHERE u.username = p_username
  AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default users (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
    INSERT INTO users (username, password_hash, role)
    VALUES ('admin', crypt('admin123', gen_salt('bf')), 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'cashier') THEN
    INSERT INTO users (username, password_hash, role)
    VALUES ('cashier', crypt('cashier123', gen_salt('bf')), 'CASHIER');
  END IF;
END $$;
