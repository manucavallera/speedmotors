CREATE TYPE IF NOT EXISTS "purchase_order_status" AS ENUM ('borrador', 'enviada', 'recibida', 'cancelada');

CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id" serial PRIMARY KEY,
  "supplier_id" integer REFERENCES "suppliers"("id"),
  "user_id" integer REFERENCES "users"("id") NOT NULL,
  "status" "purchase_order_status" NOT NULL DEFAULT 'borrador',
  "notes" text,
  "total" numeric(12,2) NOT NULL DEFAULT 0,
  "amount_formal" numeric(12,2) NOT NULL DEFAULT '0',
  "amount_informal" numeric(12,2) NOT NULL DEFAULT '0',
  "expected_date" timestamp,
  "received_at" timestamp,
  "created_at" timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchase_order_items" (
  "id" serial PRIMARY KEY,
  "order_id" integer REFERENCES "purchase_orders"("id") NOT NULL,
  "product_id" integer REFERENCES "products"("id"),
  "description" varchar(255) NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price" numeric(12,2) NOT NULL DEFAULT 0,
  "subtotal" numeric(12,2) NOT NULL DEFAULT 0
);
