# Mapa de navegacion -- SpeedMotors

## Archivos criticos (leer antes de tocar)
| Archivo                              | Tokens est. | Cuando leerlo                        |
|--------------------------------------|-------------|--------------------------------------|
| apps/backend/src/db/schema.ts        | ~600        | Cualquier cambio de DB o modelo      |
| apps/backend/src/sales/sales.service.ts | ~400     | Logica de ventas, cuotas, stock      |
| apps/frontend/src/pages/SalesPage.tsx   | ~700     | UI de ventas                         |
| apps/frontend/src/lib/api.ts            | ~80      | Cambios de endpoints o auth          |
| apps/frontend/src/lib/pdf.ts            | ~300     | Generacion de PDFs                   |

## Modulos por dominio
| Dominio      | Backend service                        | Frontend page          | Tokens est. |
|--------------|----------------------------------------|------------------------|-------------|
| Ventas       | sales/sales.service.ts                 | SalesPage.tsx          | ~1100       |
| Vehiculos    | vehicles/vehicles.service.ts           | VehiclesPage.tsx       | ~900        |
| Productos    | products/products.service.ts           | ProductsPage.tsx       | ~800        |
| Clientes     | clients/clients.service.ts             | ClientsPage.tsx        | ~400        |
| Caja         | cash/cash.service.ts                   | CashPage.tsx           | ~500        |
| Cuotas       | (dentro de sales.service)              | InstallmentsPage.tsx   | ~400        |
| Reportes     | reports/reports.service.ts             | ReportsPage.tsx        | ~600        |
| Presupuestos | quotes/quotes.service.ts               | QuotesPage.tsx         | ~500        |
| OC           | purchase-orders/purchase-orders.service| PurchaseOrdersPage.tsx | ~400        |
| Gastos       | expenses/expenses.service.ts           | ExpensesPage.tsx       | ~300        |

## Componentes UI reutilizables
- Modal.tsx          -- wrapper de dialogo
- FormField.tsx      -- label + input, exporta inputStyle/btnPrimary/btnSecondary
- QRModal.tsx        -- QR simple o dual (chasis + importacion)
- InfoBanner.tsx     -- banner informativo azul en cada pagina

## Learnings por tema (cargar segun tarea)
| Archivo                              | Tokens est. | Cuando cargarlo                        |
|--------------------------------------|-------------|----------------------------------------|
| docs/learnings/database-patterns.md  | ~400        | Cambios de schema, queries, Drizzle    |
| docs/learnings/api-design.md         | ~350        | Agregar endpoints, modulos NestJS      |
| docs/learnings/authentication.md     | ~250        | Auth, JWT, roles, guards               |
| docs/learnings/performance.md        | ~300        | Optimizacion, lentitud, re-renders     |
| docs/learnings/common-pitfalls.md    | ~350        | Debug, errores raros, reglas negocio   |
| docs/learnings/deployment.md         | ~250        | Deploy, variables de entorno, build    |

## Nunca auto-cargar (0 tokens)
- .claude/completions/** -- historial de tareas completadas
- .claude/sessions/**    -- sesiones guardadas
- docs/archive/**        -- documentacion historica

## Estimacion antes vs despues
Antes (sin estructura): ~8.000 tokens por sesion
Inicio de sesion ahora: ~800 tokens (4 archivos core)
Tarea tipica:           ~1.300 tokens (core + 1 learning)
Ahorro:                 ~85%
