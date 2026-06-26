-- Proveeduría: área de producto + ventas POS propias

DO $$ BEGIN
  CREATE TYPE product_area AS ENUM ('concesionaria', 'proveeduria');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Separar productos de concesionaria (repuestos) vs proveeduría (comida/bebida)
ALTER TABLE products ADD COLUMN IF NOT EXISTS area product_area NOT NULL DEFAULT 'concesionaria';

CREATE TABLE IF NOT EXISTS proveeduria_sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proveeduria_sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES proveeduria_sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_area ON products(area);
CREATE INDEX IF NOT EXISTS idx_proveeduria_sale_items_sale ON proveeduria_sale_items(sale_id);
