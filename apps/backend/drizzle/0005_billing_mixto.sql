ALTER TYPE "public"."invoice_type" ADD VALUE 'mixto';

ALTER TABLE "sales" ADD COLUMN "amount_formal" numeric(12,2) NOT NULL DEFAULT '0';
ALTER TABLE "sales" ADD COLUMN "amount_informal" numeric(12,2) NOT NULL DEFAULT '0';

ALTER TABLE "sale_items" ADD COLUMN "ingreso_tipo" varchar(10);
