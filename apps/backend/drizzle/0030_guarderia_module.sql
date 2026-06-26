-- Guardería náutica: tipo de cliente + lugares + unidades guardadas + cobros

-- Enums
DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('concesionaria', 'guarderia');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE storage_unit_status AS ENUM ('en_guarderia', 'retirada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Distinguir clientes de concesionaria vs guardería (misma tabla, listas separadas)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type client_type NOT NULL DEFAULT 'concesionaria';

-- Lugares físicos de la guardería (predefinidos)
CREATE TABLE IF NOT EXISTS storage_spots (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  label VARCHAR(50),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Embarcación guardada por un cliente en un lugar
CREATE TABLE IF NOT EXISTS storage_units (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  spot_id INTEGER REFERENCES storage_spots(id),
  description VARCHAR(150) NOT NULL,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  entry_date TIMESTAMP NOT NULL DEFAULT now(),
  exit_date TIMESTAMP,
  status storage_unit_status NOT NULL DEFAULT 'en_guarderia',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Cobros generados (entran a caja + cuenta corriente)
CREATE TABLE IF NOT EXISTS storage_charges (
  id SERIAL PRIMARY KEY,
  storage_unit_id INTEGER NOT NULL REFERENCES storage_units(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  period_label VARCHAR(40),
  charge_date TIMESTAMP NOT NULL DEFAULT now(),
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_units_client ON storage_units(client_id);
CREATE INDEX IF NOT EXISTS idx_storage_units_spot ON storage_units(spot_id);
CREATE INDEX IF NOT EXISTS idx_storage_charges_unit ON storage_charges(storage_unit_id);
