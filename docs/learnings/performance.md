# Performance -- SpeedMotors
~300 tokens

## Frontend

TanStack Query: staleTime y cacheTime
-- Datos que no cambian seguido (clientes, productos): staleTime: 1000 * 60 * 5
-- Datos en tiempo real (ventas, stock): staleTime: 0 (default)

Evitar re-renders innecesarios
-- No crear objetos/arrays inline en JSX (crean nueva referencia en cada render)
-- queryKey descriptivo y estable: ['vehicles', typeFilter, statusFilter]

Sort y filter client-side
-- Para listas pequenas (<500 items): sort/filter en el frontend evita requests extra
-- Patron establecido: [...data].sort() antes del return, nunca mutar el array original

## Backend

Drizzle: seleccionar solo columnas necesarias
-- db.select({ id: table.id, name: table.name }).from(table)  -- mejor que select()
-- Para listados grandes evitar select() sin columnas especificas

Indices en PostgreSQL (agregar si hay queries lentos)
-- CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
-- CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

## Imagenes / uploads
-- Multer en /upload endpoint
-- Guardar URL en products.photo_url, no el binario
-- Limite: 5MB por archivo

## Docker DB
-- Para seeds grandes usar COPY en lugar de INSERT masivo
-- speedmotors-db tiene 1 sola instancia -- no escalar en dev
