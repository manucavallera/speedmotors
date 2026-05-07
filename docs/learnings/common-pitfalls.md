# Anti-patrones confirmados -- SpeedMotors
~350 tokens

## Drizzle
PITFALL: numeric retorna string
  mal:  if (product.sellPrice > 0)
  bien: if (Number(product.sellPrice) > 0)

PITFALL: schema.ts desincronizado con la DB
  -- Si agrego campo en schema.ts sin ALTER TABLE -> error en runtime silencioso
  -- Siempre los dos juntos: schema + ALTER TABLE + restart backend

PITFALL: select() sin where en tabla grande
  -- Agrega siempre al menos .limit(500) si no hay filtro de usuario

## NestJS
PITFALL: dependencia circular entre modulos
  -- Services que se inyectan mutuamente -> crash al iniciar
  -- Solucion: extraer logica comun a un shared service o usar eventos

PITFALL: no usar ParseIntPipe en params numericos
  mal:  @Param('id') id: number  -- llega como string igual
  bien: @Param('id', ParseIntPipe) id: number

## React / TanStack Query
PITFALL: queryKey que no refleja los filtros
  mal:  queryKey: ['vehicles']  -- no refetcha al cambiar filtros
  bien: queryKey: ['vehicles', typeFilter, statusFilter]

PITFALL: mutar el array de data directamente para sort
  mal:  data.sort(...)          -- muta el cache de TanStack Query
  bien: [...data].sort(...)

PITFALL: any en estado del form
  -- Usar interfaces explicitas o typeof table.$inferInsert

## Negocio (reglas criticas)
- vehicle.status = 'vendido' -> NO mostrar en selector de ventas
- invoice_type A o B + ingresoTipo 'negro' -> mostrar warning (no bloquear)
- stock de products: solo modificar via StockMovements (no edicion directa)
- cuotas: se generan en sales.service al crear venta con installmentCount > 1
- cancelar venta: restaura stock de products, vuelve vehicle a 'disponible'
