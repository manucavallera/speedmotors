-- Caja separada: SpeedMotors (ventas motos/lanchas) vs Marina (guardería/turnera/proveeduría)
CREATE TYPE "cash_area" AS ENUM ('speedmotors', 'marina');

ALTER TABLE "cash_sessions"
  ADD COLUMN "area" "cash_area" NOT NULL DEFAULT 'speedmotors';
