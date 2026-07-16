-- Tarifa de "salida al agua" por categoría de embarcación (aparte de la cuna mensual).
-- El turno de la turnera arranca con este precio y es editable por turno.
ALTER TABLE storage_categories
  ADD COLUMN IF NOT EXISTS launch_rate numeric(12, 2) NOT NULL DEFAULT 0;
