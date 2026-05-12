# Auditoría Completa SpeedMotors — Pre-Producción

Sos un auditor técnico senior. Tu trabajo es revisar el sistema **SpeedMotors** (gestión de stock de motos/lanchas) y determinar si está listo para producción y entrega al cliente.

## Contexto del proyecto

- **Stack:** NestJS 11 + Drizzle ORM + PostgreSQL + React 19 + Vite + TanStack Query v5
- **Dominio:** Concesionaria de motos y lanchas en Crespo, Entre Ríos
- **Operadores:** 2 roles (admin, vendedor)
- **Cliente final:** dueño del negocio (no técnico)
- **Carga estimada:** <50 usuarios concurrentes, <100k registros/año
- **Working dir:** `/mnt/c/Users/coco/proyectos/speedmotors`
- **Schema fuente:** `apps/backend/src/db/*.schema.ts`
- **Migrations:** `apps/backend/drizzle/`

Revisar `CLAUDE.md`, `.wolf/anatomy.md`, `.wolf/memory.md` antes de arrancar para entender estado actual.

## Categorías a auditar

### 1. Seguridad (CRÍTICO)
- [ ] `JWT_SECRET` no hardcodeado, configurable por env
- [ ] Tokens con expiración razonable, refresh flow si aplica
- [ ] Endpoints sensibles tienen `AdminGuard` (deletes, users, reports)
- [ ] No hay SQL crudo concatenado en services (solo Drizzle ORM)
- [ ] Class-validator activo en todos los DTOs de creación/edición
- [ ] Rate limiting en endpoints de login/auth
- [ ] Passwords hasheadas con bcrypt
- [ ] CORS configurado restrictivamente para prod
- [ ] No hay secrets commiteados (.env, credenciales, JWT keys)
- [ ] Headers de seguridad (Helmet, CSP)
- [ ] XSS: no se usa `dangerouslySetInnerHTML` con datos de usuario
- [ ] CSRF: si hay cookies, validar; si solo JWT en header, OK

### 2. Integridad de datos (CRÍTICO)
- [ ] FKs declaradas en todas las tablas relacionadas
- [ ] `onDelete` policy explícita (CASCADE/SET NULL/RESTRICT) donde corresponde
- [ ] Migrations idempotentes (DO blocks para CREATE TYPE)
- [ ] Todas las migrations aplicadas al último estado
- [ ] No hay datos de seed en producción confundibles con datos reales
- [ ] Transacciones (`db.transaction`) en operaciones multi-tabla (ej: venta + items + cuotas + stock)
- [ ] Numeric/decimal precision correcta para montos (12,2)
- [ ] Timestamps con timezone awareness

### 3. Lógica de negocio (CRÍTICO)
- [ ] Cálculo de cuotas con interés: verificar fórmulas (sistema francés, etc.)
- [ ] IVA en facturación: cálculos correctos para A/B/X
- [ ] Stock se descuenta al vender, se incrementa al anular
- [ ] Reservas: bloquean stock o solo el vehículo específico
- [ ] Cierre de caja: cuadre matemático (ingresos - egresos = balance)
- [ ] Cuenta corriente: saldo = ventas pendientes - pagos a cuenta + notas débito
- [ ] Conversión de moneda (USD/pesos) en cuotas
- [ ] Estado de vehículos: disponible → reservado → vendido (transiciones válidas)

### 4. Robustez y manejo de errores
- [ ] ErrorBoundary cubre toda la app
- [ ] Try/catch en operaciones críticas de backend
- [ ] Errores de backend devuelven mensajes claros (class-validator)
- [ ] Frontend muestra errores con `apiError()` helper
- [ ] No hay `console.log` de debug commiteados
- [ ] Logger de NestJS en operaciones críticas (creación, pago, cierre caja)
- [ ] Manejo de errores async sin await catch silencioso

### 5. Performance
- [ ] Índices DB en columnas de búsqueda/filtro (clientId, vehicleId, saleDate, status)
- [ ] Paginación en endpoints que listan colecciones grandes
- [ ] No hay queries N+1 (revisar findAll que cargan relaciones)
- [ ] TanStack Query con `staleTime` razonable para datos estables
- [ ] `invalidateQueries` solo lo necesario, no toda la cache
- [ ] Bundle size frontend razonable (<500KB gzipped)
- [ ] Imágenes optimizadas (compresión, lazy loading)
- [ ] PDFs grandes se generan sin congelar UI

### 6. UX y entregabilidad
- [ ] Estados de carga (loading) en todas las páginas async
- [ ] Estados vacíos (empty state) con CTA claro
- [ ] Estados de error visibles, no silenciosos
- [ ] Confirmaciones en operaciones destructivas (delete)
- [ ] Botones disabled durante mutaciones (no doble submit)
- [ ] Formularios con validación inline + feedback backend
- [ ] Navegación clara, no hay rutas rotas
- [ ] Búsquedas con debounce
- [ ] Responsive: funciona en tablet (operario mostrando moto al cliente)
- [ ] Accesibilidad básica: labels en inputs, alt en imgs, contraste WCAG AA
- [ ] No hay textos en inglés mezclados con español
- [ ] PDFs imprimibles correctamente formateados

### 7. Despliegue y producción
- [ ] Dockerfile multi-stage optimizado
- [ ] docker-compose con healthchecks
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] `NODE_ENV=production` en build
- [ ] Logs estructurados, no solo `console.log`
- [ ] Backup automático configurado (script existe en `scripts/backup.sh`)
- [ ] Restore probado al menos una vez
- [ ] Estrategia de monitoreo (uptime, errores) — aunque sea básica
- [ ] Plan de rollback si una migration rompe algo

### 8. Documentación y entregable
- [ ] README con instalación paso a paso
- [ ] Manual de usuario básico (cómo registrar venta, alta cliente, etc.)
- [ ] Credenciales iniciales documentadas (admin user por defecto)
- [ ] Instrucciones de backup/restore claras
- [ ] Lista de variables de entorno explicadas
- [ ] Diagrama de arquitectura (aunque sea ASCII)
- [ ] Contacto de soporte/desarrollador documentado

### 9. Calidad de código
- [ ] No hay `any` en TypeScript (prohibido por CLAUDE.md)
- [ ] No hay código muerto (componentes sin usar, imports sin uso)
- [ ] No hay TODO/FIXME críticos sin resolver
- [ ] Convenciones consistentes (naming, estructura de carpetas)
- [ ] Componentes <1500 tokens (regla de proyecto)
- [ ] Pages son orquestadores livianos, lógica en hooks
- [ ] Inline styles consistentes (regla de proyecto)

### 10. Testing y validación manual
- [ ] Tests unitarios en lógica de negocio crítica (cuotas, IVA, balance)
- [ ] Flujos E2E manuales documentados:
  - [ ] Alta cliente → venta contado → recibo PDF
  - [ ] Alta cliente → venta cuotas → cobro cuota → cuenta corriente actualizada
  - [ ] Reserva → conversión a venta → stock descontado
  - [ ] Cierre de caja con movimientos múltiples
  - [ ] Login admin vs vendedor (permisos diferenciados)
  - [ ] Backup → restore → datos íntegros

## Formato de salida

Generar `AUDIT_REPORT.md` con esta estructura:

```markdown
# Auditoría SpeedMotors — [Fecha]

## Resumen ejecutivo
- Estado general: [LISTO / LISTO CON CONDICIONES / NO LISTO]
- Bloqueadores críticos: N
- Issues importantes: N
- Optimizaciones recomendadas: N
- Mejoras futuras: N

## 🔴 Bloqueadores críticos (impiden entrega)
Listar cada uno con:
- **Categoría:** [Seguridad/Datos/Negocio/etc.]
- **Archivo:line:** path concreto
- **Problema:** descripción
- **Riesgo:** qué pasa si no se arregla
- **Fix sugerido:** cómo resolverlo
- **Esfuerzo:** [trivial / chico / medio / grande]

## 🟡 Issues importantes (entregable pero recomendable)
Mismo formato que bloqueadores.

## 🟢 Optimizaciones (post-entrega, mejoran calidad)
Listar con: archivo, problema, fix, esfuerzo.

## 🔵 Mejoras futuras (roadmap)
Features o cambios arquitectónicos sugeridos a 3-6 meses. Sin urgencia.

## Métricas
- Archivos auditados: N
- Endpoints revisados: N
- Tablas DB revisadas: N
- Cobertura tests aprox: %
- Bundle size frontend: KB

## Checklist de entrega
- [ ] item 1
- [ ] item 2
...

## Próximos pasos recomendados
1. Resolver bloqueadores (estimación: X días)
2. Configurar backup automático en servidor
3. Capacitación al cliente (Y horas)
4. ...
```

## Reglas de auditoría

1. **Usar evidencia concreta** — todo finding debe citar `archivo:línea`
2. **No inventar** — si no estás seguro, anotar como "Requiere verificación manual"
3. **Severidad realista** — un `any` en código no es bloqueador, un SQL injection sí
4. **Pensar como el cliente** — ¿qué pasa si se rompe a la noche un sábado?
5. **Sugerir fixes accionables** — no "mejorar la seguridad", sino "agregar Helmet en main.ts"
6. **Diferenciar entrega vs producción** — entregable puede tolerar más deuda que un sistema 24/7 con SLA
7. **Verificar últimas commits** — revisar `git log --oneline -20` para entender qué se hizo recientemente
8. **Probar mentalmente flujos críticos** — leer el código siguiendo el path de una venta de punta a punta

## Output esperado

Al terminar, devolver:
1. `AUDIT_REPORT.md` completo en la raíz del repo
2. Tres bullets resumen al usuario:
   - "¿Está listo para entregar?"
   - "¿Cuántos días de trabajo faltan para que esté listo?"
   - "¿Cuál es el bloqueador más crítico?"

No avanzar con fixes — solo auditar. Si encontrás algo trivial, dejarlo anotado para que el dueño decida.
