-- Config de la grilla de turnos: pasa de localStorage al servidor (2026-07-13)
-- Tiene que vivir en el backend porque el cliente va a reservar su turno desde el celular,
-- y el intervalo lo define el dueño (arranca en 10 min, según lo que pidió).

CREATE TABLE IF NOT EXISTS turnera_config (
  id integer PRIMARY KEY DEFAULT 1,
  interval_min integer NOT NULL DEFAULT 10,
  day_start varchar(5) NOT NULL DEFAULT '07:00',
  day_end varchar(5) NOT NULL DEFAULT '20:00',
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT turnera_config_single_row CHECK (id = 1)
);

INSERT INTO turnera_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
