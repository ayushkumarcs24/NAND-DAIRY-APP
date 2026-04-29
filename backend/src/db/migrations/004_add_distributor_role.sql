-- Migration 004: Fix role constraint and add updated_at to products
-- (Ensures 'distributor' is in the check — already done by 003,
--  but this is idempotent if re-run)

-- 1. Idempotent role constraint fix
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'milk-entry', 'fat-snf', 'report', 'distributor'));

-- 2. Add updated_at to products (for PUT endpoint tracking)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
