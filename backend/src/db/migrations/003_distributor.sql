-- ============================================================
--  003_distributor.sql
--  Adds distributor role, products, orders, order_items tables
-- ============================================================

-- 1. Extend role constraint to include distributor
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'milk-entry', 'fat-snf', 'report', 'distributor'));

-- 2. Products — managed by admin
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  price         DECIMAL(10, 2) NOT NULL,
  unit          VARCHAR(20)  DEFAULT 'liter',
  is_available  BOOLEAN      DEFAULT TRUE,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Distributor orders (one buffer day to pay)
CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  distributor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount   DECIMAL(15, 2) NOT NULL,
  status         VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date       DATE NOT NULL,   -- created_at::date + 1
  paid_at        TIMESTAMP,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Line items per order
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    DECIMAL(10, 2) NOT NULL,
  unit_price  DECIMAL(10, 2) NOT NULL,   -- price snapshot at order time
  subtotal    DECIMAL(15, 2) NOT NULL
);
