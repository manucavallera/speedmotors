-- Guardería: categorías de embarcación (tarifa por HP/eslora) + siembra de las 192 cunas (2026-07-13)
-- Feedback del cliente: la tarifa mensual sale de la categoría (ej: 2-35 HP, 40-90 HP, 90+ HP).
-- Las cunas son fijas: A1..A48, B1..B48, C1..C48, D1..D48. Hoy operativas solo A y B (C y D sin piso).

CREATE TABLE IF NOT EXISTS storage_categories (
  id serial PRIMARY KEY,
  name varchar(60) NOT NULL,
  min_hp integer,
  max_hp integer,
  min_length numeric(5,2),
  max_length numeric(5,2),
  monthly_rate numeric(12,2) NOT NULL DEFAULT '0',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

-- La lancha guarda sus datos reales (HP/eslora) y la categoría que le corresponde.
-- rate sigue existiendo: es el precio efectivo (arranca en el de la categoría, editable por excepción).
ALTER TABLE storage_units ADD COLUMN IF NOT EXISTS category_id integer REFERENCES storage_categories(id);
ALTER TABLE storage_units ADD COLUMN IF NOT EXISTS hp integer;
ALTER TABLE storage_units ADD COLUMN IF NOT EXISTS length_m numeric(5,2);

-- Cunas: 48 por línea. C y D quedan inactivas hasta que se haga el piso.
INSERT INTO storage_spots (code, label, active)
SELECT l || n, 'Línea ' || l, l IN ('A', 'B')
FROM unnest(ARRAY['A', 'B', 'C', 'D']) AS l, generate_series(1, 48) AS n
ON CONFLICT (code) DO NOTHING;

-- Categorías base (escalas que nombró el cliente). Precio en 0: lo carga él desde la app.
INSERT INTO storage_categories (name, min_hp, max_hp, monthly_rate)
SELECT * FROM (VALUES
  ('Chica (2 a 35 HP)', 2, 35, 0),
  ('Mediana (40 a 90 HP)', 40, 90, 0),
  ('Grande (más de 90 HP)', 91, NULL, 0)
) AS v(name, min_hp, max_hp, monthly_rate)
WHERE NOT EXISTS (SELECT 1 FROM storage_categories);

-- Servicios base (los que nombró el cliente). Precio en 0: los carga él. Puede agregar y borrar.
INSERT INTO storage_services (name, price)
SELECT * FROM (VALUES
  ('Bajada al agua', 0),
  ('Combustible', 0),
  ('Alquiler de batería', 0),
  ('Alquiler de parrilla', 0),
  ('Asado (por kilo)', 0),
  ('Seguro de guarda', 0),
  ('Seguro de navegación', 0),
  ('Seguro completo (guarda + navegación)', 0)
) AS v(name, price)
WHERE NOT EXISTS (SELECT 1 FROM storage_services);
