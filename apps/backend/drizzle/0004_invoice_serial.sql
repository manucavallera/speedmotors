ALTER TABLE "products" ADD COLUMN "serial_number" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "cuit" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "condicion_iva" varchar(50) DEFAULT 'consumidor_final';--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('A', 'B', 'X');--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "invoice_type" "invoice_type" DEFAULT 'X' NOT NULL;
