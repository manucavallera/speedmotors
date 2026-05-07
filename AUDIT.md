# AUDIT — SpeedMotors
Fecha: 2026-05-07

## Verdict: NO APTO para producción

Bloqueantes críticos en seguridad (CORS abierto, JWT fallback hardcodeado), ausencia total de validación de DTOs, ausencia de rate limiting en login, y operaciones financieras sin transacciones DB. El sistema es funcional para demo/staging pero expone vectores de ataque directos en producción.

---

## ❌ Bloqueantes (deben fixearse antes de lanzar)

### SEGURIDAD

- **CORS completamente ausente:** `main.ts` no llama a `app.enableCors()`. En producción, cualquier dominio puede hacer requests al backend. [apps/backend/src/main.ts:8]

- **JWT_SECRET fallback hardcodeado:** `secretOrKey: process.env.JWT_SECRET || 'secret'` — si la variable no está seteada, todos los tokens se firman con `'secret'`. Mismo pattern en AuthModule. [apps/backend/src/auth/jwt.strategy.ts:10] [apps/backend/src/auth/auth.module.ts:12]

- **Sin rate limiting en /auth/login:** No hay `@nestjs/throttler` en ningún módulo ni endpoint. El endpoint de login acepta intentos ilimitados — brute force directo. [apps/backend/src/auth/auth.controller.ts:8]

- **Sin ValidationPipe global:** No hay `app.useGlobalPipes(new ValidationPipe())` en `main.ts`. Todos los DTOs son interfaces TypeScript (no clases con decorators), lo que significa que NestJS no valida ni sanitiza ningún campo entrante en runtime. Un atacante puede enviar cualquier payload. [apps/backend/src/main.ts] — ningún archivo tiene `class-validator` decorators.

- **@Body() body: any en endpoints críticos:** Sin ValidationPipe, todos estos endpoints aceptan payloads arbitrarios en producción: ventas (`sales.controller.ts:26`), clientes (`clients.controller.ts:41`), vehículos (`vehicles.controller.ts:30`), productos (`products.controller.ts:29`), gastos (`expenses.controller.ts:14`), presupuestos (`quotes.controller.ts:14`), órdenes de compra (`purchase-orders.controller.ts:17`). Total: 29 ocurrencias de `: any` en backend.

- **Upload: validación MIME-only bypasseable:** El file filter chequea `file.mimetype` que viene del cliente (HTTP header), no del contenido real del archivo. Un atacante puede subir un `.php` o ejecutable con `Content-Type: image/jpeg`. [apps/backend/src/upload/upload.controller.ts:24]

- **Operaciones financieras sin transacción DB:** `sales.service.create()` ejecuta entre 5 y 15 queries separadas (insert venta, insert items, update stock por cada producto, update vehículos, insert cuotas) sin `db.transaction()`. Si cualquier query falla a mitad, queda una venta creada sin cuotas, o stock decrementado sin venta. Mismo problema en `cancelSale()`. [apps/backend/src/sales/sales.service.ts:23-122, 125-145]

- **Race condition en stock:** `cancelSale()` y `create()` hacen read-modify-write sin transacción ni `FOR UPDATE`: leen `product.stock`, restan, escriben. Con dos ventas simultáneas del mismo producto el stock puede quedar incorrecto. [apps/backend/src/sales/sales.service.ts:97-101, 131-136]

- **Race condition en saleNumber:** `COUNT(*) + 1` como número de venta es incorrecto bajo concurrencia: dos ventas simultáneas obtienen el mismo count, generan el mismo `saleNumber`. Viola unicidad y rompe numeración fiscal. [apps/backend/src/sales/sales.service.ts:59-61]

### INFRAESTRUCTURA

- **Paginación ausente en todas las listas principales:** Los siguientes endpoints devuelven TODOS los registros sin `LIMIT`/`OFFSET`:
  - `GET /sales` — `sales.service.ts:9`
  - `GET /clients` — `clients.service.ts:8` (solo filtra, no pagina)
  - `GET /vehicles` — `vehicles.service.ts:8`
  - `GET /expenses` — `expenses.service.ts`
  - `GET /transfers` — `transfers.service.ts`
  - `GET /reservations` — `reservations.service.ts`
  - `GET /purchase-orders` — `purchase-orders.service.ts`
  - `GET /quotes` — `quotes.service.ts`
  - `GET /reminders` — `reminders.service.ts:25`
  - `GET /clients/:id/sales` — `clients.service.ts:27`
  Con 5000+ ventas/año esto garantiza timeouts y crashes de memoria en 2-3 años.

- **Sin índices DB en columnas de alta consulta:** Ningún schema tiene `index()` de Drizzle. Faltan índices en:
  - `installments.saleId` — join frecuente
  - `installments.status` — filtrado en alerts y reports
  - `installments.dueDate` — filtrado en vencimientos
  - `sales.clientId` — join en account
  - `sales.createdAt` — filtrado en todos los reports
  - `sales.userId` — dashboard por vendedor
  - `vehicles.status` — filtrado principal
  - `reminders.dueDate` — alerts
  - `reminders.userId`
  Con 5000 ventas/año los queries de reports harán full table scans. [apps/backend/src/db/*.schema.ts — ninguno]

---

## ⚠️ Críticos (fixear en primer mes)

### BUGS

- **userId undefined en creación de reminders:** El JWT strategy retorna `{ id, email, role }` (campo `id`), pero `alerts.controller.ts` accede a `req.user.userId` (campo inexistente). Todos los reminders se crean con `userId = undefined`, fallando la constraint NOT NULL o insertando NULL. [apps/backend/src/alerts/alerts.controller.ts:25-26] vs [apps/backend/src/auth/jwt.strategy.ts:14]

- **`cancelSale` lanza `new Error()` en lugar de `BadRequestException`:** NestJS no maneja `Error` nativo como HTTP exception, devuelve 500 en lugar de 400. [apps/backend/src/sales/sales.service.ts:127]

- **`importProducts` silencia todos los errores:** El `catch {}` vacío incrementa el contador de errores pero no loguea nada. En producción es imposible diagnosticar por qué falló una importación. [apps/backend/src/products/products.service.ts:84]

- **Autenticación frontend valida solo presencia de token, no expiración:** `useAuth` chequea `!!token` en localStorage pero no verifica el campo `exp` del JWT. Un token expirado (7 días) mantiene al usuario "autenticado" en el cliente hasta que una request falle con 401. [apps/frontend/src/hooks/useAuth.ts:6-14]

- **Frontend filtra ventas en memoria en lugar de backend:** `useSales` carga TODAS las ventas y filtra por fecha/cliente/tipo en el browser. Con 5000 ventas esto congela la UI. [apps/frontend/src/hooks/useSales.ts:41-49]

### SEGURIDAD

- **Sin AdminGuard en endpoints de delete/cancel críticos:** `DELETE /clients/:id`, `DELETE /vehicles/:id`, `POST /sales/:id/cancel`, `DELETE /expenses/:id`, `DELETE /transfers/:id`, `DELETE /reservations/:id` — cualquier usuario autenticado (rol vendedor) puede borrar/cancelar cualquier registro. Solo `UsersController` usa `AdminGuard`. [apps/backend/src/sales/sales.controller.ts:31] [apps/backend/src/clients/clients.controller.ts:51] [apps/backend/src/vehicles/vehicles.controller.ts:44]

- **Sin validación de ownership en ventas:** Un vendedor puede ver y cancelar ventas de otro vendedor. `GET /sales` devuelve todas las ventas del sistema sin filtrar por `userId`. [apps/backend/src/sales/sales.service.ts:9]

- **PWA cachea respuestas de API por 24 horas:** El service worker tiene `runtimeCaching` para `/api/*` con `maxAgeSeconds: 86400`. Esto incluye datos financieros sensibles (saldos, ventas) que quedan en el cache del dispositivo por un día, incluso después de logout. [apps/frontend/vite.config.ts:29-38]

- **Token JWT almacenado en localStorage:** Susceptible a XSS. No es un bloqueante inmediato dado que el frontend no usa `innerHTML`/`dangerouslySetInnerHTML`, pero es práctica insegura. [apps/frontend/src/lib/api.ts:8]

### CALIDAD

- **12 queries secuenciales en `getFullReport`:** El loop de evolución mensual ejecuta 12 queries DB una por una en un `for` síncrono (2 por mes, 6 meses). Esto puede tardar 200-500ms con carga. Usar `Promise.all` o un single GROUP BY. [apps/backend/src/reports/reports.service.ts:118-140]

- **`importProducts` sin límite de tamaño:** El endpoint acepta `body.products: any[]` sin validar cuántos items tiene. Un array de 100k productos bloquea el event loop. [apps/backend/src/products/products.controller.ts:43]

- **`stock-movements` hardcodea LIMIT 200:** No es paginación real — si hay más de 200 movimientos los anteriores son invisibles sin advertencia al usuario. [apps/backend/src/stock-movements/stock-movements.service.ts:13]

- **`get /clients/:id/account` con inArray en saleIds:** Si un cliente tiene 500 ventas, el `inArray(installments.saleId, saleIds)` genera `WHERE sale_id IN (1,2,...,500)`. Sin índice en `saleId` esto es un full table scan. [apps/backend/src/clients/clients.service.ts:51]

- **`.env.example` incompleto:** Solo tiene `DB_PASSWORD` y `JWT_SECRET`. Falta documentar `DATABASE_URL`, `PORT`, `NODE_ENV`. El `DATABASE_URL` está en `docker-compose.yml` pero no en `.env.example`, lo que confunde en deploy sin Docker. [/.env.example]

- **`console.log` en seeds:** Solo en archivos de seed — no es crítico pero seed-testing.ts tiene 30+ console.log que se ejecutan si alguien corre el seed en producción accidentalmente. [apps/backend/src/db/seeds/seed-testing.ts]

- **180 ocurrencias de `: any` en frontend:** Viola la regla "TypeScript estricto — prohibido any" del CLAUDE.md del proyecto. Impide detectar errores en tiempo de compilación. [apps/frontend/src/ — múltiples archivos]

- **Sin `onError` handler en mutations:** Ningún hook de frontend (`useSales`, `useClients`, `useProducts`, etc.) define `onError` en sus `useMutation`. Los errores de red o validación se pierden silenciosamente — el usuario no recibe feedback. [apps/frontend/src/hooks/useSales.ts:31-39] y equivalentes.

- **Sin confirmación en deletes críticos:** No hay `window.confirm` ni modal de confirmación antes de eliminar clientes, vehículos, gastos, proveedores. El borrado es inmediato con un click. Solo algunos componentes lo implementan. [apps/frontend/src/hooks/useClients.ts:28-30]

---

## 🔵 Roadmap (3-6 meses)

- **Multi-sucursal:** Agregar tabla `branches` con `id`, `name`, `address`. Añadir `branchId` FK a `sales`, `vehicles`, `users`, `cash_sessions`, `expenses`. Sin esto no escala a 3-5 sucursales.

- **Roles granulares (vendedor solo ve sus ventas):** Modificar `sales.service.findAll()` para filtrar por `userId` cuando `req.user.role === 'vendedor'`. Extender a presupuestos, reservas y cuotas.

- **Audit log:** Tabla `audit_log (id, userId, action, entity, entityId, oldData jsonb, newData jsonb, createdAt)`. Loguear creates/updates/deletes en ventas, clientes, vehículos. Obligatorio para concesionaria con múltiples vendedores.

- **Integración AFIP:** Implementar factura electrónica tipo A/B via AFIP web services (WSFE). El campo `invoiceType` ya existe en el schema, falta la integración real.

- **Notificaciones email/WhatsApp:** Alertas automáticas para cuotas vencidas (installments.status = 'pendiente' y dueDate < now). Considerar Nodemailer + Twilio/WA Business API.

- **Export a Excel:** Endpoint `GET /sales/export?from=&to=` que genere XLSX via `exceljs`. Necesario para contabilidad externa.

- **Búsqueda avanzada con filtros combinados:** Los filtros actuales son client-side. Mover a backend con query parameters en todos los endpoints (combinaciones de fecha + estado + vendedor + tipo).

- **ErrorBoundary en frontend:** Ninguna ruta tiene `<ErrorBoundary>`. Un error de render no capturado baja toda la app. Implementar con `react-error-boundary`.

- **Dashboard filtrado por vendedor:** El backend ya devuelve `bySeller` en `/reports/dashboard`. El frontend tiene `SalesBySellerWidget` pero sin filtro interactivo por vendedor.

- **Paginación en frontend:** Una vez que el backend implementa `page`/`limit`, reemplazar queries que traen todo por queries paginadas con `useInfiniteQuery` o paginación simple.

---

## Plan recomendado

### Sprint 1 — esta semana (seguridad crítica, ~20h)

| Item | Horas | Archivo |
|------|-------|---------|
| Agregar `app.enableCors({ origin: [URL_PROD] })` | 0.5h | main.ts |
| Eliminar fallback `|| 'secret'` en JWT (forzar fallo si no hay env) | 0.5h | jwt.strategy.ts, auth.module.ts |
| Instalar `@nestjs/throttler`, aplicar 5 req/min a POST /auth/login | 2h | app.module.ts, auth.controller.ts |
| Agregar `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` | 1h | main.ts |
| Convertir CreateSaleDto, CreateReservationDto, CreateTransferDto de interface a class con class-validator | 4h | DTOs |
| Wrappear `sales.service.create()` y `cancelSale()` en `db.transaction()` | 3h | sales.service.ts |
| Reemplazar COUNT(*)+1 por `SEQUENCE` o `SELECT MAX(id)+1 FOR UPDATE` para saleNumber | 2h | sales.service.ts |
| Fix: `req.user.userId` → `req.user.id` en alerts.controller | 0.5h | alerts.controller.ts |
| Fix: `throw new Error()` → `throw new BadRequestException()` en cancelSale | 0.5h | sales.service.ts |
| Agregar `AdminGuard` a DELETE/cancel en sales, clients, vehicles, expenses | 2h | controllers |
| Validar file content (magic bytes) en upload, no solo MIME | 2h | upload.controller.ts |
| Fix stock decrement: verificar `product.stock >= item.quantity` antes de restar | 1h | sales.service.ts |

### Sprint 2 — próximas 2 semanas (~30h)

| Item | Horas |
|------|-------|
| Paginación en backend: agregar `?page=&limit=` a sales, clients, vehicles, expenses, transfers, reservations, quotes, purchase-orders | 8h |
| Mover filtros de ventas de frontend a backend (fecha, invoiceType, clientId) | 4h |
| Índices DB: `dueDate`, `saleId`, `status` en installments; `clientId`, `createdAt`, `userId` en sales; `status` en vehicles; `dueDate` en reminders | 2h |
| `onError` handlers en todas las mutations de frontend con toast/alert al usuario | 3h |
| Confirmación antes de deletes destructivos (modal, no `window.confirm`) | 2h |
| Mover filtros PWA cache fuera de `/api/auth` y `/api/reports` | 1h |
| Validar expiración JWT en `useAuth` (campo `exp` del payload) | 1h |
| Limitar `importProducts` a máximo 500 items por request | 1h |
| Reemplazar loop secuencial en `getFullReport` por single query GROUP BY EXTRACT(MONTH) | 3h |
| Completar `.env.example` con todas las variables | 0.5h |
| Reducir `any` en frontend: tipar respuestas de API con interfaces | 4h |

### Roadmap (3-6 meses)

- **Mes 1-2:** Multi-sucursal (branches table + branchId en entidades) + Audit log + Roles granulares (vendedor ve solo sus datos)
- **Mes 2-3:** Factura electrónica AFIP + Export Excel/CSV + ErrorBoundary en frontend
- **Mes 3-6:** Notificaciones email/WhatsApp cuotas vencidas + Búsqueda avanzada server-side + Dashboard multi-sucursal

---

## Resumen de hallazgos

| Categoría | Bloqueantes | Críticos | Info |
|-----------|------------|---------|------|
| Seguridad | 5 | 4 | 1 |
| Bugs | 0 | 5 | 0 |
| Infraestructura | 3 | 4 | 2 |
| Calidad | 0 | 3 | 2 |
| **Total** | **8** | **16** | **3** |

**Horas estimadas Sprint 1:** ~20h  
**Horas estimadas Sprint 2:** ~30h  
**Deuda técnica acumulada si no se atiende:** el sistema rompe bajo carga con 500+ vehículos activos y múltiples vendedores concurrentes. Las operaciones financieras sin transacciones son el riesgo más alto — un crash a mitad de una venta en cuotas deja datos inconsistentes sin forma de detectarlo.
