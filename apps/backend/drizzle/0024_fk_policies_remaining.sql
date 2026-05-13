-- FK policies para tablas omitidas en 0018

-- quotes.client_id → SET NULL
DO $$ BEGIN
  ALTER TABLE quotes DROP CONSTRAINT IF EXISTS "quotes_client_id_clients_id_fk";
  ALTER TABLE quotes ADD CONSTRAINT "quotes_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'quotes.client_id fk: %', SQLERRM; END $$;

-- quotes.user_id → RESTRICT
DO $$ BEGIN
  ALTER TABLE quotes DROP CONSTRAINT IF EXISTS "quotes_user_id_users_id_fk";
  ALTER TABLE quotes ADD CONSTRAINT "quotes_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN RAISE NOTICE 'quotes.user_id fk: %', SQLERRM; END $$;

-- quote_items.quote_id → CASCADE
DO $$ BEGIN
  ALTER TABLE quote_items DROP CONSTRAINT IF EXISTS "quote_items_quote_id_quotes_id_fk";
  ALTER TABLE quote_items ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk"
    FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN RAISE NOTICE 'quote_items.quote_id fk: %', SQLERRM; END $$;

-- quote_items.product_id → SET NULL
DO $$ BEGIN
  ALTER TABLE quote_items DROP CONSTRAINT IF EXISTS "quote_items_product_id_products_id_fk";
  ALTER TABLE quote_items ADD CONSTRAINT "quote_items_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'quote_items.product_id fk: %', SQLERRM; END $$;

-- quote_items.vehicle_id → SET NULL
DO $$ BEGIN
  ALTER TABLE quote_items DROP CONSTRAINT IF EXISTS "quote_items_vehicle_id_vehicles_id_fk";
  ALTER TABLE quote_items ADD CONSTRAINT "quote_items_vehicle_id_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'quote_items.vehicle_id fk: %', SQLERRM; END $$;

-- purchase_orders.supplier_id → SET NULL
DO $$ BEGIN
  ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS "purchase_orders_supplier_id_suppliers_id_fk";
  ALTER TABLE purchase_orders ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'purchase_orders.supplier_id fk: %', SQLERRM; END $$;

-- purchase_order_items.order_id → CASCADE
DO $$ BEGIN
  ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS "purchase_order_items_order_id_purchase_orders_id_fk";
  ALTER TABLE purchase_order_items ADD CONSTRAINT "purchase_order_items_order_id_purchase_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN RAISE NOTICE 'purchase_order_items.order_id fk: %', SQLERRM; END $$;

-- purchase_order_items.product_id → SET NULL
DO $$ BEGIN
  ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS "purchase_order_items_product_id_products_id_fk";
  ALTER TABLE purchase_order_items ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;
EXCEPTION WHEN others THEN RAISE NOTICE 'purchase_order_items.product_id fk: %', SQLERRM; END $$;

-- cash_movements.session_id → CASCADE
DO $$ BEGIN
  ALTER TABLE cash_movements DROP CONSTRAINT IF EXISTS "cash_movements_session_id_cash_sessions_id_fk";
  ALTER TABLE cash_movements ADD CONSTRAINT "cash_movements_session_id_cash_sessions_id_fk"
    FOREIGN KEY ("session_id") REFERENCES "cash_sessions"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN RAISE NOTICE 'cash_movements.session_id fk: %', SQLERRM; END $$;

-- cash_sessions.user_id → RESTRICT
DO $$ BEGIN
  ALTER TABLE cash_sessions DROP CONSTRAINT IF EXISTS "cash_sessions_user_id_users_id_fk";
  ALTER TABLE cash_sessions ADD CONSTRAINT "cash_sessions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN RAISE NOTICE 'cash_sessions.user_id fk: %', SQLERRM; END $$;

-- expenses.user_id → RESTRICT
DO $$ BEGIN
  ALTER TABLE expenses DROP CONSTRAINT IF EXISTS "expenses_user_id_users_id_fk";
  ALTER TABLE expenses ADD CONSTRAINT "expenses_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN RAISE NOTICE 'expenses.user_id fk: %', SQLERRM; END $$;

-- stock_movements.product_id → CASCADE (movimiento no tiene sentido sin producto)
DO $$ BEGIN
  ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS "stock_movements_product_id_products_id_fk";
  ALTER TABLE stock_movements ADD CONSTRAINT "stock_movements_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
EXCEPTION WHEN others THEN RAISE NOTICE 'stock_movements.product_id fk: %', SQLERRM; END $$;

-- stock_movements.user_id → RESTRICT
DO $$ BEGIN
  ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS "stock_movements_user_id_users_id_fk";
  ALTER TABLE stock_movements ADD CONSTRAINT "stock_movements_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN others THEN RAISE NOTICE 'stock_movements.user_id fk: %', SQLERRM; END $$;
