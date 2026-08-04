-- Cobros realizados con la caja cerrada. Quedan visibles y se incorporan
-- automáticamente a la próxima sesión abierta del área correspondiente.
CREATE TABLE IF NOT EXISTS "pending_cash_movements" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "area" "cash_area" NOT NULL,
  "type" "cash_movement_type" NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "reason" varchar(255),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "pending_cash_movements_area_idx"
  ON "pending_cash_movements" ("area", "created_at");
