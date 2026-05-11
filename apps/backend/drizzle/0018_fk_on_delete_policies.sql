-- Declara políticas onDelete explícitas en todas las FKs.
-- Usa DROP + ADD para actualizar constraints existentes de forma idempotente.

-- sales.client_id → SET NULL (venta persiste si cliente se borra)
DO $$ BEGIN
  ALTER TABLE sales DROP CONSTRAINT IF EXISTS "sales_client_id_clients_id_fk";
  ALTER TABLE sales ADD CONSTRAINT "sales_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'sales.client_id fk: %', SQLERRM; END $$;

-- sales.user_id → RESTRICT (no borrar usuario con ventas asociadas)
DO $$ BEGIN
  ALTER TABLE sales DROP CONSTRAINT IF EXISTS "sales_user_id_users_id_fk";
  ALTER TABLE sales ADD CONSTRAINT "sales_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN RAISE NOTICE 'sales.user_id fk: %', SQLERRM; END $$;

-- sale_items.sale_id → CASCADE (items van con la venta)
DO $$ BEGIN
  ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS "sale_items_sale_id_sales_id_fk";
  ALTER TABLE sale_items ADD CONSTRAINT "sale_items_sale_id_sales_id_fk"
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN RAISE NOTICE 'sale_items.sale_id fk: %', SQLERRM; END $$;

-- sale_items.product_id → SET NULL (ítem queda con descripción aunque se inactive producto)
DO $$ BEGIN
  ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS "sale_items_product_id_products_id_fk";
  ALTER TABLE sale_items ADD CONSTRAINT "sale_items_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'sale_items.product_id fk: %', SQLERRM; END $$;

-- sale_items.vehicle_id → SET NULL
DO $$ BEGIN
  ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS "sale_items_vehicle_id_vehicles_id_fk";
  ALTER TABLE sale_items ADD CONSTRAINT "sale_items_vehicle_id_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'sale_items.vehicle_id fk: %', SQLERRM; END $$;

-- installments.sale_id → CASCADE
DO $$ BEGIN
  ALTER TABLE installments DROP CONSTRAINT IF EXISTS "installments_sale_id_sales_id_fk";
  ALTER TABLE installments ADD CONSTRAINT "installments_sale_id_sales_id_fk"
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN RAISE NOTICE 'installments.sale_id fk: %', SQLERRM; END $$;

-- products.category_id → SET NULL
DO $$ BEGIN
  ALTER TABLE products DROP CONSTRAINT IF EXISTS "products_category_id_categories_id_fk";
  ALTER TABLE products ADD CONSTRAINT "products_category_id_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'products.category_id fk: %', SQLERRM; END $$;

-- products.supplier_id → SET NULL (ya manejado en código, formalizar a nivel DB)
DO $$ BEGIN
  ALTER TABLE products DROP CONSTRAINT IF EXISTS "products_supplier_id_suppliers_id_fk";
  ALTER TABLE products ADD CONSTRAINT "products_supplier_id_suppliers_id_fk"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'products.supplier_id fk: %', SQLERRM; END $$;

-- reservations.client_id → SET NULL
DO $$ BEGIN
  ALTER TABLE reservations DROP CONSTRAINT IF EXISTS "reservations_client_id_clients_id_fk";
  ALTER TABLE reservations ADD CONSTRAINT "reservations_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'reservations.client_id fk: %', SQLERRM; END $$;

-- transfers.vehicle_id → SET NULL
DO $$ BEGIN
  ALTER TABLE transfers DROP CONSTRAINT IF EXISTS "transfers_vehicle_id_vehicles_id_fk";
  ALTER TABLE transfers ADD CONSTRAINT "transfers_vehicle_id_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'transfers.vehicle_id fk: %', SQLERRM; END $$;

-- transfers.client_id → SET NULL
DO $$ BEGIN
  ALTER TABLE transfers DROP CONSTRAINT IF EXISTS "transfers_client_id_clients_id_fk";
  ALTER TABLE transfers ADD CONSTRAINT "transfers_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'transfers.client_id fk: %', SQLERRM; END $$;

-- client_payments.client_id → RESTRICT (pagos históricos, no borrar si hay pagos)
DO $$ BEGIN
  ALTER TABLE client_payments DROP CONSTRAINT IF EXISTS "client_payments_client_id_clients_id_fk";
  ALTER TABLE client_payments ADD CONSTRAINT "client_payments_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN RAISE NOTICE 'client_payments.client_id fk: %', SQLERRM; END $$;
