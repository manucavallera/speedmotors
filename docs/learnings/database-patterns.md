# Database Patterns -- Drizzle + PostgreSQL
~400 tokens

## Pattern basico de service
// SELECT con filtros
const rows = await db.select().from(table).where(and(eq(table.field, val), eq(table.active, true)))

// INSERT
const [row] = await db.insert(table).values(data).returning()

// UPDATE
const [row] = await db.update(table)
  .set({ ...data, updatedAt: new Date() })
  .where(eq(table.id, id))
  .returning()
if (!row) throw new NotFoundException(`${id} no encontrado`)

// Soft delete
await db.update(table).set({ active: false }).where(eq(table.id, id))

## Tipos
typeof table.$inferInsert          -- para create/update (incluye opcionales)
typeof table.$inferSelect          -- para read (resultado de SELECT)
Partial<typeof table.$inferInsert> -- para update parcial

## Numeric como string
Drizzle retorna numeric/decimal como string.
Siempre: Number(row.sellPrice) o parseFloat(row.amount)

## Agregar columna (patron establecido en el proyecto)
1. Editar schema.ts: campo: varchar('campo', { length: 100 })
2. docker exec speedmotors-db psql -U speedmotors -d speedmotors \
     -c "ALTER TABLE tabla ADD COLUMN IF NOT EXISTS campo varchar(100);"
3. Reiniciar backend (Drizzle toma el schema nuevo)

## Enums en Drizzle
export const miEnum = pgEnum('mi_enum', ['val1', 'val2'])
-- En la tabla: campo: miEnum('campo').notNull().default('val1')
-- En la DB: el enum debe existir antes del ALTER TABLE

## Relaciones (Drizzle relations)
-- Solo para joins tipados, no afectan la DB
-- Definir en schema.ts al final, con relations()
-- Usar db.query.tabla.findMany({ with: { relacion: true } }) para joins

## Transacciones
await db.transaction(async (tx) => {
  await tx.insert(tabla1).values(...)
  await tx.update(tabla2).set(...).where(...)
})
