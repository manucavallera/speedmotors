# Quick Reference -- SpeedMotors

## Conexion DB local
docker exec speedmotors-db psql -U speedmotors -d speedmotors -c "SELECT 1"
Host: localhost:5432 | DB: speedmotors | User: speedmotors | Pass: speedmotors123

## Levantar entorno
docker-compose up -d          # PostgreSQL
npm run dev:backend            # :3000
npm run dev:frontend           # :5173

## Login dev
POST http://localhost:3000/auth/login
{ "email": "admin@speedmotors.com", "password": "admin123" }

## Agregar columna a tabla (patron establecido)
1. Editar apps/backend/src/db/schema.ts
2. docker exec speedmotors-db psql -U speedmotors -d speedmotors -c "ALTER TABLE x ADD COLUMN IF NOT EXISTS y type"
3. Reiniciar backend

## Agregar modulo NestJS
nest g module nombre
nest g controller nombre
nest g service nombre
Registrar en app.module.ts imports[]

## Pattern TanStack Query
const { data = [] } = useQuery({ queryKey: ['key'], queryFn: () => api.get('/ruta').then(r => r.data) })
const mut = useMutation({ mutationFn: (d) => api.post('/ruta', d), onSuccess: () => qc.invalidateQueries({ queryKey: ['key'] }) })

## Pattern Drizzle service
// findAll
db.select().from(table).where(and(...conditions))
// create
const [row] = await db.insert(table).values(data).returning()
// update
const [row] = await db.update(table).set({ ...data, updatedAt: new Date() }).where(eq(table.id, id)).returning()

## Tipos Drizzle
typeof table.$inferInsert   -- para create (todos los campos)
typeof table.$inferSelect   -- para read (resultado de SELECT)
Partial<typeof table.$inferInsert>  -- para update

## ingresoTipo (blanco/negro)
Tablas: vehicles.ingreso_tipo, products.ingreso_tipo
Valores: 'blanco' | 'negro' | null
Conflicto en venta: ingresoTipo='negro' + invoiceType in ('A','B') -> warning UI

## invoice_type en sales
'A' = Factura A (Responsable Inscripto) -- en blanco
'B' = Factura B (Consumidor final)      -- en blanco
'X' = Sin factura / comprobante interno -- en negro
