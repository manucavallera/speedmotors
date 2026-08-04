-- Una cuna física no puede tener dos embarcaciones activas, aunque lleguen dos altas/movimientos juntos.
CREATE UNIQUE INDEX IF NOT EXISTS storage_units_one_active_per_spot
  ON storage_units (spot_id)
  WHERE status = 'en_guarderia' AND spot_id IS NOT NULL;
