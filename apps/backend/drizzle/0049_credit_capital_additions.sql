CREATE TABLE IF NOT EXISTS "credit_capital_additions" (
  "id" serial PRIMARY KEY NOT NULL,
  "credit_id" integer NOT NULL REFERENCES "credits"("id") ON DELETE cascade,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "amount" numeric(12, 2) NOT NULL,
  "effective_date" timestamp NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "credit_capital_additions_credit_idx"
  ON "credit_capital_additions" USING btree ("credit_id", "effective_date");
