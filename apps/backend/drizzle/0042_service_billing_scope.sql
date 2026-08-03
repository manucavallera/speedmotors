-- Dónde se puede cobrar cada servicio del catálogo.
-- Antes el catálogo era único y todo servicio aparecía en los dos lados: un seguro
-- adherido a la lancha (cobro mensual) también se ofrecía al reservar un turno,
-- con riesgo de cobrarlo dos veces.
-- Default true en ambas para no cambiar el comportamiento de lo ya cargado.
ALTER TABLE storage_services ADD COLUMN IF NOT EXISTS for_unit boolean NOT NULL DEFAULT true;
ALTER TABLE storage_services ADD COLUMN IF NOT EXISTS for_slot boolean NOT NULL DEFAULT true;

DO $$ BEGIN
  ALTER TABLE storage_services
    ADD CONSTRAINT storage_services_has_billing_scope CHECK (for_unit OR for_slot);
EXCEPTION WHEN duplicate_object THEN null; END $$;
