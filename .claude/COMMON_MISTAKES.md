# Errores comunes -- SpeedMotors

## NestJS / Drizzle

WRONG: inyectar service en otro creando dep circular
RIGHT: extraer logica a helper o usar `forwardRef()` como ultimo recurso

WRONG: `db.select().from(table)` sin filtro en tablas grandes
RIGHT: siempre agregar `.where()` o `.limit()`

WRONG: usar string para numeric de Drizzle
RIGHT: Drizzle retorna numeric como string -- siempre `Number(row.price)` o `parseFloat()`

WRONG: mutar schema.ts sin correr ALTER TABLE en Docker
RIGHT: schema.ts + docker exec psql ALTER TABLE van siempre juntos

WRONG: import circular entre modulos NestJS
RIGHT: cada modulo exporta solo lo necesario; db en DbModule global

## React / TanStack Query

WRONG: fetch directo con useEffect + useState
RIGHT: useQuery con queryKey descriptivo

WRONG: invalidar toda cache tras mutation
RIGHT: `invalidateQueries({ queryKey: ['recurso-especifico'] })`

WRONG: any en props o state
RIGHT: interfaces explicitas; `typeof table.$inferInsert` para tipos Drizzle

WRONG: modificar estado TanStack Query directo
RIGHT: useMutation -> onSuccess -> invalidateQueries

## Negocio

- vehicles `status='vendido'` no aparecer en selector ventas
- `invoice_type='X'` = negro; `'A'/'B'` = blanco
- `ingresoTipo='negro'` + `invoiceType='A'/'B'` = conflicto -- mostrar warning
- stock de products baja automatico al crear sale con productId en items
- vehicles cambian status a `'vendido'` automatico al cerrar venta
- cuotas se generan en sales.service al recibir `installmentCount > 1`
