# Auditoría SpeedMotors — 2026-05-11

## Resumen ejecutivo
- **Estado general:** LISTO CON CONDICIONES
- **Bloqueadores críticos:** 7
- **Issues importantes:** 14
- **Optimizaciones recomendadas:** 11
- **Mejoras futuras:** 6

Sistema técnicamente sólido (Drizzle ORM, JWT, transactions en venta, ValidationPipe global, ErrorBoundary, throttler en login, backup script, notificaciones por email). Bloqueadores son concretos y corregibles en 1-3 días. Riesgo principal: **reservas no bloquean stock/vehículo**, **race conditions en numeración** y **roles granulares incompletos**.

---

## 🔴 Bloqueadores críticos (impiden entrega)

### 1. Reservas no bloquean el vehículo reservado
- **Categoría:** Lógica de negocio
- **Archivo:** `apps/backend/src/reservations/reservations.service.ts:28-56`
- **Problema:** `create()` solo inserta fila en `reservations`. No actualiza `vehicles.status` a `reservado` ni descuenta stock. Dos clientes pueden reservar el mismo vehículo. Una venta puede ocurrir contra un vehículo reservado.
- **Riesgo:** Vender el mismo vehículo dos veces. Pérdida de seña, conflicto con cliente.
- **Fix sugerido:** En `create()`, si `data.vehicleId` está presente, abrir `db.transaction` y `UPDATE vehicles SET status='reservado' WHERE id = X AND status='disponible' RETURNING *`. Si no devuelve fila → rollback con `ConflictException`. En `updateStatus(cancelada|concretada)` liberar/marcar como `disponible`/`vendido`.
- **Esfuerzo:** chico (1-2h)

### 2. Race condition en numeración (reservations + transfers)
- **Categoría:** Integridad de datos
- **Archivo:** `apps/backend/src/reservations/reservations.service.ts:29-31`, `apps/backend/src/transfers/transfers.service.ts:73-75`
- **Problema:** `reservationNumber` y `transferNumber` se calculan con `SELECT COUNT(*) + 1`. Dos POST concurrentes → mismo número.
- **Riesgo:** Numeración duplicada → confusión legal/contable, imposibilidad de identificar inequívocamente el documento.
- **Fix sugerido:** Usar `id` serial (igual que `sales.service.ts:104-106` que sí lo hace bien: insert con `PENDING`, update con `id` después).
- **Esfuerzo:** chico (30min cada uno)

### 3. Endpoints sensibles sin AdminGuard
- **Categoría:** Seguridad / Negocio
- **Archivo:**
  - `apps/backend/src/products/products.controller.ts:42-65` (POST/PUT/DELETE/import sin AdminGuard)
  - `apps/backend/src/vehicles/vehicles.controller.ts` (POST/PUT sin guard, solo DELETE en `:49`)
  - `apps/backend/src/suppliers/suppliers.controller.ts:6` (vendedor puede CRUD proveedores)
  - `apps/backend/src/reports/reports.controller.ts:6` (vendedor ve reportes consolidados con costos)
  - `apps/backend/src/cash/cash.controller.ts:5` (vendedor puede cerrar caja)
- **Problema:** El rol `vendedor` tiene acceso a operaciones administrativas (crear productos, cambiar precios de vehículos, ver márgenes en reportes, cerrar caja).
- **Riesgo:** Fraude interno, modificación de precios sin trazabilidad, leak de información de costos.
- **Fix sugerido:** Decidir matriz de permisos con el cliente. Agregar `@UseGuards(AdminGuard)` en endpoints de escritura de catálogo/precios y en reports/cash.
- **Esfuerzo:** medio (2-3h con decisión del dueño)

### 4. JWT_EXPIRES_IN no se lee del entorno
- **Categoría:** Seguridad
- **Archivo:** `apps/backend/src/auth/auth.module.ts:13` y `apps/backend/.env.example:3`
- **Problema:** `signOptions: { expiresIn: '7d' }` hardcoded. La variable `JWT_EXPIRES_IN` del `.env.example` no se usa. 7 días es excesivo para sistema de gestión sin refresh tokens.
- **Riesgo:** Token robado válido durante una semana. Sin mecanismo para invalidar sesiones.
- **Fix sugerido:** `expiresIn: process.env.JWT_EXPIRES_IN ?? '12h'`. Documentar que no hay revocación; cambiar `JWT_SECRET` invalida todas las sesiones.
- **Esfuerzo:** trivial (5min)

### 5. Helmet / security headers ausentes
- **Categoría:** Seguridad
- **Archivo:** `apps/backend/src/main.ts:10-25`
- **Problema:** No hay `app.use(helmet())`. Faltan headers de seguridad (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, X-XSS-Protection).
- **Riesgo:** Clickjacking, MIME sniffing, falta de HSTS si se sirve por HTTPS.
- **Fix sugerido:** `npm i helmet` y `app.use(helmet())` en `main.ts`.
- **Esfuerzo:** trivial (10min)

### 6. Sin backup ni restore probado en producción
- **Categoría:** Despliegue / continuidad
- **Archivo:** `scripts/backup.sh`
- **Problema:** Script existe pero (a) no hay cron registrado, (b) backups solo locales — si falla el server se pierde todo, (c) restore nunca probado.
- **Riesgo:** Pérdida total de datos ante hardware failure o ransomware.
- **Fix sugerido:** (1) Registrar cron en el host de prod `0 3 * * * /ruta/scripts/backup.sh`. (2) Subir el `.sql.gz` a almacenamiento offsite (Google Drive vía rclone, S3, Backblaze). (3) Hacer un restore de prueba en otra DB y verificar que arranca.
- **Esfuerzo:** medio (3-4h primera vez)

### 7. Migración automática en startup sin estrategia de rollback
- **Categoría:** Despliegue
- **Archivo:** `apps/backend/src/main.ts:11`
- **Problema:** `await migrate(db, { migrationsFolder: './drizzle' })` corre antes de levantar el server. Si una migration falla → backend no levanta. Sin rollback ni dry-run.
- **Riesgo:** Despliegue roto sin servicio. Recovery manual requerido (SSH + psql).
- **Fix sugerido:** (a) Mantener backup antes de migrate (script pre-deploy). (b) En prod considerar migrate manual: comando dedicado `npm run migrate` y `CMD ["node", "dist/src/main"]` sin auto-migrate. (c) Documentar plan de rollback.
- **Esfuerzo:** chico (1h)

---

## 🟡 Issues importantes (entregable pero recomendable)

### 8. FKs sin política `onDelete`
- **Archivo:** `apps/backend/src/db/*.schema.ts` (todos)
- **Problema:** Ninguna FK declara `.references(() => x.id, { onDelete: 'set null' })` ni similar. Default = `NO ACTION`. Por eso aparecen errores 23503 al borrar (ver fix commit `d8a3e1f`).
- **Fix:** Declarar explícitamente: clientes→sales `SET NULL`, suppliers→products `SET NULL` (ya manualmente nullea), users→sales `RESTRICT`, vehicles→saleItems `RESTRICT` (no permitir borrar vendido). Generar migration de alteración.
- **Esfuerzo:** medio (2h)

### 9. `saleItems` sin validación XOR productId/vehicleId
- **Archivo:** `apps/backend/src/sales/create-sale.dto.ts:4-27` y `sales.service.ts:121-135`
- **Problema:** Un item puede tener AMBOS `productId` y `vehicleId`, o ninguno. La service descuenta stock de ambos. DTO no valida.
- **Fix:** Custom validator `@ValidateBy` que asegure exactamente uno de los dos. O check explícito en service.
- **Esfuerzo:** chico (30min)

### 10. Cash session: race en `openSession`
- **Archivo:** `apps/backend/src/cash/cash.service.ts:17-22`
- **Problema:** `getOpenSession()` + `insert` sin lock. Dos POST simultáneos abren dos cajas.
- **Fix:** Unique partial index en DB: `CREATE UNIQUE INDEX cash_one_open ON cash_sessions(status) WHERE status='abierta'` o usar `db.transaction` con `SELECT ... FOR UPDATE`.
- **Esfuerzo:** chico (30min)

### 11. `cancelSale` lee fuera de transacción
- **Archivo:** `apps/backend/src/sales/sales.service.ts:151-172`
- **Problema:** `await this.findOne(id)` fuera del `db.transaction`. Entre la lectura y la cancelación, otra request puede modificar items.
- **Fix:** Mover lectura adentro de la transacción.
- **Esfuerzo:** chico (15min)

### 12. Sin lock pesimista en descuento de stock
- **Archivo:** `apps/backend/src/sales/sales.service.ts:121-135`
- **Problema:** Lee `product.stock` y luego escribe `stock - quantity`. Dentro de transaction pero sin `FOR UPDATE`. Dos ventas concurrentes del mismo producto pueden vender por debajo de 0.
- **Fix:** Usar `UPDATE products SET stock = stock - X WHERE id = Y AND stock >= X RETURNING *` (atómico). Si no devuelve fila → throw.
- **Esfuerzo:** chico (30min)

### 13. Vehículos no bloquean con XOR/lock al vender
- **Archivo:** `apps/backend/src/sales/sales.service.ts:130-134`
- **Problema:** `UPDATE vehicles SET status='vendido'` sin verificar status previo. Vehículo ya vendido se "vende" otra vez sin error.
- **Fix:** `UPDATE vehicles SET status='vendido' WHERE id = X AND status IN ('disponible','reservado') RETURNING *`. Si rowCount=0 → throw.
- **Esfuerzo:** chico (15min)

### 14. `payInstallment` sin amount/método/idempotencia
- **Archivo:** `apps/backend/src/sales/sales.service.ts:174-182`
- **Problema:** Marca cuota como pagada pero no guarda monto pagado, método (efectivo/transf), ni controla doble cobro. Si se llama dos veces → la fecha se sobrescribe pero no rompe; sin trazabilidad financiera.
- **Fix:** Validar `status='pendiente'` antes de update. Persistir `paidAmount`, `paymentMethod`, idealmente registrar en `cashMovements`.
- **Esfuerzo:** medio (1-2h)

### 15. Timestamps sin timezone
- **Archivo:** Todos los `*.schema.ts` usan `timestamp(...)` (= `TIMESTAMP WITHOUT TIME ZONE`)
- **Problema:** Server en UTC + cliente en GMT-3 puede leer fechas desfasadas. Cron `@Cron(EVERY_DAY_AT_9AM)` corre en TZ del proceso.
- **Fix:** Migrar a `timestamp(..., { withTimezone: true })` en columnas críticas (`createdAt`, `dueDate`, `paidAt`). Setear `TZ=America/Argentina/Buenos_Aires` en docker-compose.
- **Esfuerzo:** medio (2h + testing)

### 16. `any` real en services y controllers
- **Archivo:**
  - `apps/backend/src/sales/sales.service.ts:184` (`updateTransport(id, data: any)`)
  - `apps/backend/src/expenses/expenses.service.ts:21,29`
  - `apps/backend/src/suppliers/suppliers.service.ts:28,38`
  - `apps/backend/src/products/products.controller.ts:58` (`{ products: any[] }`)
  - `apps/backend/src/clients/clients.controller.ts:37` (addPayment body)
  - `apps/backend/src/stock-movements/stock-movements.controller.ts:14`
- **Problema:** Viola `CLAUDE.md` ("prohibido `any`"). ValidationPipe global no valida → permite payloads arbitrarios en endpoints con guards.
- **Fix:** Crear DTOs con class-validator para cada uno.
- **Esfuerzo:** medio (3h)

### 17. Usuarios: faltan reglas defensivas
- **Archivo:** `apps/backend/src/users/users.service.ts`
- **Problema:** (a) sin política de password (largo mínimo, complejidad), (b) admin puede borrarse a sí mismo, (c) puede quedarse el sistema sin admins, (d) DELETE hard sin verificar FKs (ventas).
- **Fix:** DTOs con `@MinLength(8)`, check `if (id === req.user.id) throw`, check `count(role='admin') > 1` antes de borrar/degradar último admin, soft-delete o reasignar ventas.
- **Esfuerzo:** medio (2h)

### 18. CORS por defecto solo localhost:5173
- **Archivo:** `apps/backend/src/main.ts:14-17`
- **Problema:** Si `ALLOWED_ORIGINS` no se setea en producción, CORS rechaza al frontend en dominio real. `docker-compose.yml` no lo define.
- **Fix:** Agregar `ALLOWED_ORIGINS=https://app.speedmotors.com.ar` (o el dominio real) en `docker-compose.yml:25-28` y `.env.example`.
- **Esfuerzo:** trivial (5min, requiere dominio definido)

### 19. Backend sin healthcheck en docker-compose
- **Archivo:** `docker-compose.yml:19-30`
- **Problema:** `db` tiene healthcheck, `backend` no. EasyPanel no sabe si el proceso está saludable.
- **Fix:** Agregar endpoint `/health` en `app.controller.ts` y `healthcheck: test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]`.
- **Esfuerzo:** chico (30min)

### 20. ThrottlerModule global pero solo aplicado en login
- **Archivo:** `apps/backend/src/app.module.ts:29` y `auth.controller.ts:10`
- **Problema:** `ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])` registrado pero `ThrottlerGuard` no es `APP_GUARD` global. Solo `auth/login` lo usa. Endpoints como `addPayment`, `importProducts`, `createSale` no tienen rate limit.
- **Fix:** En `app.module.ts` providers: `{ provide: APP_GUARD, useClass: ThrottlerGuard }`. Ajustar límites por ruta con `@SkipThrottle()` donde no aplique.
- **Esfuerzo:** chico (45min)

### 21. Sin tests automatizados de lógica de negocio crítica
- **Archivo:** solo existen `app.controller.spec.ts` (1 trivial) y `app.e2e-spec.ts` (1 endpoint)
- **Problema:** Cálculo de cuotas con interés (sistema francés), conciliación de caja, ratio formal/informal, no están testeados. Una refactor puede romper números sin detectarlo.
- **Fix:** Unit tests Jest sobre `sales.service.create` (al menos: contado, cuotas pesos, cuotas usd, mixto blanco/negro), `cash.service.closeSession`, IVA.
- **Esfuerzo:** medio (1 día)

---

## 🟢 Optimizaciones (post-entrega, mejoran calidad)

### 22. Frontend bundle sin medir
- **Archivo:** `apps/frontend/`
- **Problema:** No hay `dist/` generado. Bundle size desconocido. `App.tsx:1-25` importa todas las páginas eagerly.
- **Fix:** `npm run build` y revisar bundle. Lazy-load páginas con `React.lazy(() => import('./pages/X'))` si supera 500KB gzipped.
- **Esfuerzo:** chico (1h)

### 23. `importProducts` sin transacción
- **Archivo:** `apps/backend/src/products/products.service.ts:78-119`
- **Problema:** Chunk de 100 sin transaction. Si falla la mitad, queda en estado parcial.
- **Fix:** Envolver cada chunk en `db.transaction`.
- **Esfuerzo:** chico (15min)

### 24. `console.error` en lugar de Logger NestJS
- **Archivo:** `apps/backend/src/products/products.service.ts:115`
- **Fix:** `private readonly logger = new Logger(ProductsService.name)` y `this.logger.error(...)`.
- **Esfuerzo:** trivial (5min)

### 25. `dateFrom`/`dateTo` parsing inseguro
- **Archivo:** `apps/backend/src/sales/sales.service.ts:17-22`
- **Problema:** `new Date(params.dateFrom)` con string inválido genera `Invalid Date`, query falla en runtime.
- **Fix:** Validar en DTO con `@IsDateString()`.
- **Esfuerzo:** trivial (10min)

### 26. Notifications email: posible HTML injection
- **Archivo:** `apps/backend/src/notifications/notifications.service.ts:60-67`
- **Problema:** `clientName` se interpola en HTML sin escape. Cliente con name `<script>` → email queda malformado (no es XSS porque el destino es admin en su mail client, pero ensucia).
- **Fix:** Escape básico (`&` → `&amp;`, `<` → `&lt;`). O usar plantilla con `html-escaper`.
- **Esfuerzo:** trivial (15min)

### 27. `reservation_extra_fields` migration 0014 + 0015 duplicado
- **Archivo:** `apps/backend/drizzle/0015_transport_and_iva.sql` y `0015_vehicle_photo.sql`
- **Problema:** Dos migrations con prefijo `0015`. Confunde el orden.
- **Fix:** Renombrar una a `0016_*`.
- **Esfuerzo:** trivial (5min)

### 28. `apply_purchase_orders.sql` huérfano en `drizzle/`
- **Archivo:** `apps/backend/drizzle/apply_purchase_orders.sql`
- **Problema:** Archivo fuera del flujo normal de drizzle. Puede correr o no según la herramienta.
- **Fix:** Mover a `scripts/manual/` o eliminar si ya está integrado.
- **Esfuerzo:** trivial (2min)

### 29. Sin paginación garantizada en `pendingInstallments` / `clientsTable`
- **Archivo:** `apps/backend/src/sales/sales.service.ts:200-216`, varios `*.service.ts`
- **Problema:** `getPendingInstallments()` retorna todo sin limit. Con 100k registros en 1 año puede ser lento.
- **Fix:** Agregar `.limit(500)` o paginar.
- **Esfuerzo:** chico (30min)

### 30. NODE_ENV no seteado en docker-compose
- **Archivo:** `docker-compose.yml:25-28`
- **Problema:** NestJS muestra warnings/extra logging si `NODE_ENV` no es `production`.
- **Fix:** Agregar `NODE_ENV: production` en `environment`.
- **Esfuerzo:** trivial (1min)

### 31. Reservation status update sin transacción liberando vehículo
- **Archivo:** `apps/backend/src/reservations/reservations.service.ts:85-89`
- **Problema:** Si se implementa bloqueo de vehículo (item #1), `updateStatus` debe liberar el vehículo dentro de transaction al cancelar.
- **Fix:** Junto con #1.
- **Esfuerzo:** chico (incluido en #1)

### 32. Logs estructurados ausentes
- **Archivo:** `apps/backend/src/main.ts`
- **Problema:** Sin pino/winston. Logs default de NestJS no son JSON, dificultan parsing si se sube a un agregador.
- **Fix:** Opcional para v1. Considerar `nestjs-pino` si se integra observabilidad.
- **Esfuerzo:** medio (post-entrega)

---

## 🔵 Mejoras futuras (roadmap 3-6 meses)

### 33. Auditoría/log de cambios (audit trail)
Quién modificó qué (precio, stock, cancelación de venta). Tabla `audit_logs` o trigger PG.

### 34. Refresh tokens + revocación de sesión
Token de acceso 15min + refresh 7d en httpOnly cookie. Tabla `refresh_tokens` para invalidar.

### 35. 2FA para usuarios admin
TOTP. Especialmente si el negocio crece.

### 36. Reportería AFIP / facturación electrónica
Hoy solo guarda `invoiceType` A/B/X. No integra ARCA. Si el cliente lo necesita, es un sprint dedicado.

### 37. Multi-sucursal / inventario por ubicación
Si abren otra concesionaria, el schema actual no separa stock por sucursal.

### 38. Monitoreo (Sentry + uptime)
Frontend errores no se reportan en ningún lado. Sentry free tier resuelve.

---

## Métricas

- **Archivos auditados:** ~40 (backend services/controllers críticos, DTOs, schema, frontend App + ErrorBoundary, docker, scripts, env)
- **Endpoints revisados:** ~80 (todos los `*.controller.ts`)
- **Tablas DB revisadas:** 18 (`apps/backend/src/db/*.schema.ts`)
- **Cobertura tests aprox:** <1% (1 spec trivial + 1 e2e trivial)
- **Bundle size frontend:** sin medir (no hay `dist/` build)
- **Archivos tracked en repo:** 125
- **Migrations:** 16 (incluyendo dos `0015_*` con colisión de prefijo)

---

## Checklist de entrega

- [ ] Helmet instalado y montado (#5)
- [ ] `JWT_EXPIRES_IN` leído del env, valor ≤ 12h (#4)
- [ ] Reservas bloquean vehículo + liberan en cancelación (#1)
- [ ] Numeración por `id` en reservations + transfers (#2)
- [ ] AdminGuard en products/vehicles/suppliers/reports/cash (decidir matriz con dueño) (#3)
- [ ] Backup automático configurado en server prod + restore probado offsite (#6)
- [ ] Strategy de migrate manual o backup pre-deploy (#7)
- [ ] FKs con `onDelete` declarado (#8)
- [ ] Cash session: unique index para evitar doble apertura (#10)
- [ ] Stock con `UPDATE ... WHERE stock >= X` atómico (#12)
- [ ] Vehicles update sale con check de status (#13)
- [ ] `payInstallment` registra monto/método y previene doble pago (#14)
- [ ] Throttler como APP_GUARD global (#20)
- [ ] CORS con dominio prod en `.env` (#18)
- [ ] Healthcheck backend en docker-compose (#19)
- [ ] `NODE_ENV=production` seteado (#30)
- [ ] Manual de usuario básico escrito (alta cliente, venta, cierre caja)
- [ ] Credenciales admin iniciales documentadas + fuerza al login que cambie password

---

## Próximos pasos recomendados

1. **Sprint de bloqueadores (2-3 días):** items 1, 2, 3, 4, 5, 6, 7. Sale a producción con esto cubierto.
2. **Sprint de robustez (2-3 días):** items 8-21 (importantes). Reduce errores 23503, race conditions, mejora roles.
3. **Capacitación al cliente (~3h):** demostrar flujo de venta de punta a punta, cierre de caja, exportar reportes, manejo de roles.
4. **Probar backup → restore real:** simular caída del server, restaurar dump, verificar integridad de las últimas 24h de datos.
5. **Medir bundle frontend** y aplicar lazy-load si supera 500KB gzipped (#22).
6. **Setup monitoreo básico** (#38 — Sentry free) antes de pasar al cliente.

---

## Respuestas a las 3 preguntas finales

**¿Está listo para entregar?**
No al 100%. LISTO CON CONDICIONES: con #1, #2, #3, #4, #5, #6, #7 resueltos sale a producción.

**¿Cuántos días de trabajo faltan?**
**3-5 días de trabajo concentrado** para bloqueadores. Otros **3-5 días** para issues importantes (recomendable antes de un mes de uso intensivo).

**¿Cuál es el bloqueador más crítico?**
**Reservas no bloquean el vehículo (#1)** — riesgo directo de vender el mismo vehículo dos veces, con sus consecuencias legales y de relación con el cliente. Seguido en igual peso por **roles incompletos (#3)** — un vendedor hoy puede modificar precios y cerrar caja sin auditoría.
