-- Turnera: alquiler de lanchas por franjas horarias

DO $$ BEGIN
  CREATE TYPE rental_slot_status AS ENUM ('reservado', 'cancelado', 'completado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Lanchas de alquiler (lista propia, separada del inventario de venta)
CREATE TABLE IF NOT EXISTS rental_boats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  default_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Turnos: lancha + cliente + fecha + franja horaria
CREATE TABLE IF NOT EXISTS rental_slots (
  id SERIAL PRIMARY KEY,
  boat_id INTEGER NOT NULL REFERENCES rental_boats(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status rental_slot_status NOT NULL DEFAULT 'reservado',
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rental_slots_date ON rental_slots(date);
CREATE INDEX IF NOT EXISTS idx_rental_slots_boat ON rental_slots(boat_id);
