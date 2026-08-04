-- Servicios fijos mensuales por lancha + cobro masivo del mes (2026-07-13)
-- Los seguros (guarda / navegación) se cobran TODOS los meses junto con la cuna.
-- Los puntuales (batería, combustible, asado) se agregan cuando el cliente los pide.

CREATE TABLE IF NOT EXISTS storage_unit_services (
  id serial PRIMARY KEY,
  unit_id integer NOT NULL REFERENCES storage_units(id) ON DELETE CASCADE,
  service_id integer NOT NULL REFERENCES storage_services(id),
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT storage_unit_services_uniq UNIQUE (unit_id, service_id)
);

-- El cobro masivo no puede duplicar el mes: una lancha, un cobro por período.
CREATE UNIQUE INDEX IF NOT EXISTS storage_charges_unit_period_uniq
  ON storage_charges (storage_unit_id, period_label)
  WHERE period_label IS NOT NULL;
