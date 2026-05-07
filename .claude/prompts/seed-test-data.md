# Seed completo SpeedMotors - testing exhaustivo

Quiero que pueblees la DB con datos de testing realistas que ejerciten TODAS las features
nuevas implementadas. Concesionaria en Crespo, Entre Ríos. Usá la API REST del
backend (puerto 3000) o un script TypeScript con Drizzle si preferís. Login admin:
admin@speedmotors.com / admin123.

## Lo que tenés que crear

### 1. Clientes (12 nuevos, mix de tipos)
Argentinos con DNI/CUIT real (formato), domicilios de Crespo/Paraná/Diamante.
Mezclar particulares y monotributistas. Ej: Juan Pablo Gómez, María Belén Ríos,
Cooperativa Agrícola Crespo SA, etc. Algunos con condicionIva 'consumidor_final',
otros 'monotributo' o 'responsable_inscripto'.

### 2. Vehículos (15: 10 motos + 5 lanchas)
Motos reales: Honda Wave 110, Honda CG Titan 150, Bajaj Rouser NS200, Yamaha YBR125,
Zanella ZB 110, Motomel Skua 150, Corven Triax 250, Honda XR250 Tornado.
Lanchas: Quicksilver 160, Bayliner 175, Albatros Magna, Maverick Master.
Estados mezclados: 8 disponibles, 4 reservadas, 3 vendidas. Precios realistas en ARS.

### 3. Proveedores (4)
Honda Argentina SA, Yamaha Motor Argentina, Importadora Nautica del Litoral,
Distribuidora Bajaj Cuyo.

### 4. Productos accesorios (15)
Cascos, aceites 4T, baterías, neumáticos, kits arrastre, faroles LED, etc.
Con stock variable (algunos con stock <= minStock para que aparezcan en "stock bajo").

### 5. Ventas — feature blanco/negro + financiación compuesta (8 ventas)

CRITICO: usar amountFormal y amountInformal mezclados. Configuraciones a cubrir:

- 2 ventas CONTADO con mix blanco/negro (ej: total $2.500.000 = $1.500.000 blanco
  + $1.000.000 negro). Distintos métodos de pago (efectivo, transferencia).
- 2 ventas EN CUOTAS financiadas en PESOS (financingCurrency='pesos', 5% TEM):
  - Una a 12 cuotas, principal $3M
  - Una a 18 cuotas, principal $4.5M
- 2 ventas EN CUOTAS financiadas en USD (financingCurrency='usd', 3% TEM):
  - Una a 6 cuotas, principal USD 8000 equivalente
  - Una a 24 cuotas, principal USD 15000 equivalente
- 1 venta cuotas con interés simple (sin financingCurrency, interestRate=0)
- 1 venta facturada tipo A con condicionIva responsable inscripto

### 6. Cuotas vencidas — ALERTAS AUTO

DESPUES de crear las ventas en cuotas, para 2 de ellas modificá manualmente las
primeras 2 cuotas con dueDate en el pasado (-15 días, -30 días) y status='pendiente'.
Esto debe disparar alertas en /alerts y en el sidebar badge.

UPDATE installments SET due_date = NOW() - INTERVAL '15 days' WHERE id = ...

### 7. Reservas (6 solicitudes)

- 3 VIGENTES, una creada hace >30 días (debe aparecer en alertas)
- 2 CONCRETADAS (ya pasaron a venta)
- 1 CANCELADA

Cubrir: motos y lanchas, con cónyuge y sin cónyuge, con seña y sin seña.
Datos completos: motorNumber, chassisNumber, brand, model, year, color.
Probá generar PDF y print desde la UI después.

### 8. Órdenes de Compra (4)
- 1 borrador
- 2 enviadas (deben aparecer como pendientes en alertas)
- 1 recibida
Mix con amountFormal/amountInformal. Una a Honda Argentina, otra a Yamaha.

### 9. Recordatorios manuales — feature reminders (10)

CRITICO: cubrir TODOS los tipos y recurrencias.

- Monotributo categoría D — RECURRENTE MENSUAL — vence en 5 días — $52000
- IIBB Entre Ríos — RECURRENTE MENSUAL — vencido hace 2 días (debe aparecer rojo)
- IVA — RECURRENTE MENSUAL — vence en 20 días — $180000
- Ganancias persona jurídica — RECURRENTE ANUAL — vence en 60 días — $850000
- Tasa Municipal Crespo — RECURRENTE TRIMESTRAL — vence en 12 días — $34000
- Factura Honda Argentina #A-0001-00012345 — sin recurrencia — vencida hace 7 días — $1450000
- Factura Edenor — RECURRENTE MENSUAL — vence en 3 días — $89000
- Patente moto demo — RECURRENTE ANUAL — vence en 45 días — $24000
- Seguro local — RECURRENTE ANUAL — vence en 90 días — $180000
- Recordatorio personalizado: "Renovar habilitación municipal" — sin recurrencia — vence hoy

### 10. Gastos (5 del último mes)
Alquiler local, sueldos, servicios, combustible, varios. Para que reportes muestre datos.

## Validaciones después del seed

Confirmá que después del seed:

1. /alerts muestra:
   - Critical >= 3 (cuotas vencidas + IIBB vencido + factura Honda vencida)
   - Upcoming >= 5 (cuotas próximas + recordatorios próximos + reserva +30d)
   - Total > 10
2. Sidebar badge rojo con número visible
3. Dashboard widget "Alertas pendientes" aparece con top items
4. Página /sales: las financiadas USD/pesos muestran el panel con tabla de amortización
5. Página /reservations: 3 vigentes visibles, botones PDF e Imprimir funcionando
6. Página /reports: muestra split blanco/negro con porcentajes
7. Pagar 1 reminder con recurrencia mensual debe crear automáticamente el siguiente

## Reglas
- No borres datos existentes. Solo agregá.
- Si algo falla, mostrá el error completo y seguí con el resto.
- Al final, listame un resumen tipo:
  "✓ 12 clientes, ✓ 15 vehículos, ✓ 8 ventas (4 financiadas), ..."
- Confirmá que los IDs de las cuotas que modificaste a vencidas son correctos.
