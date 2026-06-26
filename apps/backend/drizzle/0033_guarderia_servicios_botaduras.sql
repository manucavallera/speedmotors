-- Rework guardería/turnera tras feedback del cliente (2026-06-25)
-- Turnera = agenda de botaduras (lanchas de clientes en guardería, no alquiler).
-- Guardería = cobro mensual de cuna + servicios anexos configurables.

-- Catálogo de servicios anexos (seguro, lavado, puesta en marcha, batería, etc.)
CREATE TABLE IF NOT EXISTS storage_services (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT '0',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Ítems de un cobro: cuna mensual + cada servicio anexo agregado
CREATE TABLE IF NOT EXISTS storage_charge_items (
  id serial PRIMARY KEY,
  charge_id integer NOT NULL REFERENCES storage_charges(id) ON DELETE CASCADE,
  concept varchar(120) NOT NULL,
  amount numeric(12,2) NOT NULL,
  service_id integer REFERENCES storage_services(id),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Turnera: las botaduras usan las lanchas de guardería (storage_units), no una lista propia.
-- Sin datos productivos: se recrea limpio.
DROP TABLE IF EXISTS rental_slots CASCADE;
DROP TABLE IF EXISTS rental_boats CASCADE;

CREATE TABLE rental_slots (
  id serial PRIMARY KEY,
  unit_id integer NOT NULL REFERENCES storage_units(id),
  client_id integer NOT NULL REFERENCES clients(id),
  user_id integer NOT NULL REFERENCES users(id),
  date date NOT NULL,
  start_time varchar(5) NOT NULL,
  end_time varchar(5) NOT NULL,
  service_id integer REFERENCES storage_services(id),
  price numeric(12,2) NOT NULL DEFAULT '0',
  status rental_slot_status NOT NULL DEFAULT 'reservado',
  paid_at timestamp,
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);
