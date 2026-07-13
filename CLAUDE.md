# OpenWolf
@.wolf/OPENWOLF.md
Read .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.

---

# SpeedMotors — Guía técnica Claude

## Stack
- **Backend:** NestJS 11, Drizzle ORM, PostgreSQL (Docker) — puerto 5432 expuesto
- **Frontend:** React 19, Vite, TanStack Query v5, React Router v7, jsPDF
- **MCP:** PostgreSQL directo (`localhost:5432`) — usar antes de leer schema files
- **Dominio:** Gestión de stock de motos y lanchas. Crespo, Entre Ríos.

## Comandos rápidos
```bash
npm run dev:backend          # NestJS en :3000
npm run dev:frontend         # Vite en :5173
docker-compose up -d         # PostgreSQL
# Aplicar migration (NO usar `type ... | psql`: PowerShell rompe los acentos en la tubería):
docker cp apps\backend\drizzle\XXXX.sql speedmotors-db:/tmp/m.sql
docker exec speedmotors-db psql -U speedmotors -d speedmotors -f /tmp/m.sql
```

## Token Discipline (OBLIGATORIO)
- `rtk` prefix en TODO comando bash: `rtk ls`, `rtk cat`, `rtk grep`
- MCP Postgres > leer schema files (preguntá a la DB directamente)
- No reescribir archivos completos — solo diffs
- No yapping: si funciona, no se explica
- Una línea de lógica antes de cada bloque de código

## Mapa de módulos
| Módulo | Backend | Frontend |
|---|---|---|
| Ventas | `src/sales/` | `pages/SalesPage`, `components/sales/` |
| Reservas | `src/reservations/` | `pages/ReservationsPage`, `components/reservations/` |
| Vehículos | `src/vehicles/` | `pages/VehiclesPage`, `components/vehicles/` |
| Productos | `src/products/` | `pages/ProductsPage`, `components/products/` |
| Clientes | `src/clients/` | `pages/ClientsPage`, `components/clients/` |
| Proveedores | `src/suppliers/` | `pages/SuppliersPage`, `components/suppliers/` |
| Gastos | `src/expenses/` | `pages/ExpensesPage` |
| Caja | `src/cash/` | `pages/CashPage` |
| Alertas | `src/alerts/` | `pages/AlertsPage` |
| PDFs | — | `src/lib/pdf/` (remito, receipt, reservation, invoice) |

## Fuentes de verdad
- **Schema DB:** `apps/backend/src/db/schema.ts` (+ archivos `*.schema.ts` en `src/db/`)
- **Migrations:** `apps/backend/drizzle/` — última: `0014_reservation_extra_fields.sql`
- **Settings app:** `localStorage['speedmotors_settings']` → leído por `src/lib/pdf/helpers.ts`

## Patrones de código
- **TypeScript:** estricto, prohibido `any`
- **Drizzle:** única fuente de verdad — no SQL crudo fuera de migrations
- **State:** `useMutation` + `invalidateQueries` (TanStack Query)
- **Styles:** inline styles exclusivamente — no agregar librerías CSS externas
- **Formularios:** patrón `toForm()` → estado local `f` → `handleSubmit` serializa

## Para agregar nuevo módulo
1. Schema en `src/db/` + migration SQL
2. Service + Controller + Module en `src/[modulo]/`
3. Hook `use[Modulo].ts` en `src/hooks/`
4. Page en `src/pages/` (orquestador liviano)
5. Components en `src/components/[modulo]/`

## Idioma
Responder en español rioplatense. Términos técnicos en inglés.
