ALTER TABLE "purchase_orders" ADD COLUMN "amount_formal" numeric(12,2) NOT NULL DEFAULT '0';
ALTER TABLE "purchase_orders" ADD COLUMN "amount_informal" numeric(12,2) NOT NULL DEFAULT '0';
