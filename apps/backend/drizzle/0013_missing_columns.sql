ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "import_code" varchar(100);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "ingreso_tipo" varchar(10);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ingreso_tipo" varchar(10);
--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "ingreso_tipo" varchar(10);
