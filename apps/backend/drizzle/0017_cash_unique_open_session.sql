-- Garantiza que solo puede haber una caja abierta simultáneamente.
-- Partial unique index: solo aplica a filas con status='abierta'.
CREATE UNIQUE INDEX IF NOT EXISTS "cash_sessions_one_open"
  ON "cash_sessions"("status")
  WHERE "status" = 'abierta';
