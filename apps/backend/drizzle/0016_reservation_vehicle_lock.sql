-- Reservas vinculan opcionalmente a un vehículo del inventario.
-- Si vehicle_id está seteado, la reserva bloquea el vehículo en estado 'reservado'.
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "vehicle_id" integer;

DO $$ BEGIN
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicle_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "idx_reservations_vehicle_id" ON "reservations"("vehicle_id");
