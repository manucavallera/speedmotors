-- Un turno puede llevar VARIOS servicios, no uno solo (2026-07-13)
-- El cliente, al elegir el turno de salida al agua, pide batería + parrilla + combustible, etc.
-- rental_slots.price pasa a ser el total (suma de los ítems). service_id queda por compatibilidad.

CREATE TABLE IF NOT EXISTS rental_slot_items (
  id serial PRIMARY KEY,
  slot_id integer NOT NULL REFERENCES rental_slots(id) ON DELETE CASCADE,
  service_id integer REFERENCES storage_services(id),
  concept varchar(120) NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT '0',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rental_slot_items_slot_idx ON rental_slot_items(slot_id);

-- Los turnos viejos que tenían un servicio suelto pasan a ser un ítem
INSERT INTO rental_slot_items (slot_id, service_id, concept, amount)
SELECT s.id, s.service_id, coalesce(sv.name, 'Servicio'), s.price
FROM rental_slots s
JOIN storage_services sv ON sv.id = s.service_id
WHERE s.service_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rental_slot_items i WHERE i.slot_id = s.id);
