-- UNIQUE en saleNumber para evitar comprobantes duplicados
-- Idempotente: omite si ya existe o si hay duplicados (los reporta)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_sale_number_unique'
  ) THEN
    RAISE NOTICE 'Constraint sales_sale_number_unique ya existe, omitiendo';
  ELSIF EXISTS (
    SELECT sale_number FROM sales GROUP BY sale_number HAVING COUNT(*) > 1
  ) THEN
    RAISE WARNING 'Hay sale_numbers duplicados — constraint NO aplicado. Resolverlos manualmente.';
  ELSE
    ALTER TABLE "sales" ADD CONSTRAINT "sales_sale_number_unique" UNIQUE ("sale_number");
    RAISE NOTICE 'Constraint sales_sale_number_unique creado OK';
  END IF;
END $$;

-- UNIQUE compuesto en installments (saleId, number)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'installments_sale_id_number_unique'
  ) THEN
    RAISE NOTICE 'Constraint installments_sale_id_number_unique ya existe, omitiendo';
  ELSIF EXISTS (
    SELECT sale_id, number FROM installments GROUP BY sale_id, number HAVING COUNT(*) > 1
  ) THEN
    RAISE WARNING 'Hay cuotas duplicadas (sale_id, number) — constraint NO aplicado.';
  ELSE
    ALTER TABLE "installments" ADD CONSTRAINT "installments_sale_id_number_unique" UNIQUE ("sale_id", "number");
    RAISE NOTICE 'Constraint installments_sale_id_number_unique creado OK';
  END IF;
END $$;
