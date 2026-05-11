-- Ejecutar cuando Docker esté levantado:
-- docker exec speedmotors-db psql -U postgres -d speedmotors -f /tmp/apply_purchase_orders.sql
-- O pegarlo directamente en psql

CREATE TYPE IF NOT EXISTS purchase_order_status AS ENUM ('borrador', 'enviada', 'recibida', 'cancelada');

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  user_id INTEGER REFERENCES users(id) NOT NULL,
  status purchase_order_status NOT NULL DEFAULT 'borrador',
  notes TEXT,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_date TIMESTAMP,
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES purchase_orders(id) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
);
