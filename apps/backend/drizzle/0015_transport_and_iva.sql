-- Campos de transporte por venta/remito (condición IVA ya existe en clients.condicion_iva)
ALTER TABLE "sales"
  ADD COLUMN IF NOT EXISTS "transport_propio" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "transportista_nombre" varchar(100),
  ADD COLUMN IF NOT EXISTS "transportista_cuit" varchar(20),
  ADD COLUMN IF NOT EXISTS "transportista_domicilio" varchar(200),
  ADD COLUMN IF NOT EXISTS "conductor_nombre" varchar(100),
  ADD COLUMN IF NOT EXISTS "conductor_dni" varchar(20),
  ADD COLUMN IF NOT EXISTS "conductor_reg_num" varchar(50),
  ADD COLUMN IF NOT EXISTS "dominio_vehiculo" varchar(20),
  ADD COLUMN IF NOT EXISTS "dominio_acoplado" varchar(20);
