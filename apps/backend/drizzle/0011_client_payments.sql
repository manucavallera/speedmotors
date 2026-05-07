DO $$ BEGIN
  CREATE TYPE "client_payment_type" AS ENUM ('pago_cuenta', 'nota_credito', 'nota_debito');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "client_payments" (
  "id" serial PRIMARY KEY,
  "client_id" integer NOT NULL REFERENCES "clients"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" "client_payment_type" NOT NULL DEFAULT 'pago_cuenta',
  "amount" numeric(12,2) NOT NULL,
  "date" timestamp NOT NULL DEFAULT now(),
  "description" varchar(255) NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
