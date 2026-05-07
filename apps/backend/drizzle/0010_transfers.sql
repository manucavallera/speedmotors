DO $$ BEGIN
  CREATE TYPE "transfer_status" AS ENUM ('pendiente', 'en_tramite', 'completada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "transfers" (
  "id" serial PRIMARY KEY,
  "transfer_number" varchar(20),
  "vehicle_id" integer REFERENCES "vehicles"("id"),
  "client_id" integer REFERENCES "clients"("id"),
  "client_name" varchar(150) NOT NULL,
  "client_dni" varchar(20),
  "date" timestamp NOT NULL DEFAULT now(),
  "notary_name" varchar(150),
  "notary_registry" varchar(100),
  "rnp_number" varchar(100),
  "dnrpa_number" varchar(100),
  "transfer_fee" numeric(12,2) DEFAULT '0',
  "tax_amount" numeric(12,2) DEFAULT '0',
  "total_cost" numeric(12,2) DEFAULT '0',
  "status" "transfer_status" NOT NULL DEFAULT 'pendiente',
  "notes" text,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
