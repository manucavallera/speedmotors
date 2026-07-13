# Cotización — Ampliación del sistema

**Cliente:** Guardería náutica + alquiler de lanchas + proveeduría
**Base:** Se integra al sistema de gestión actual (mismos clientes, misma caja, mismo login).

---

## Resumen

Se agregan **3 módulos nuevos** al sistema que ya está funcionando. Todo conectado: los clientes, la caja y el stock son los mismos, no hay que cargar nada dos veces ni mirar dos sistemas.

| Módulo | Qué incluye | Precio |
|---|---|---|
| 1. Guardería | Gestión de lanchas/motos guardadas + cobro mensual | USD 300 |
| 2. Turnera de alquiler | Calendario de turnos para alquilar lanchas | USD 300 |
| 3. Proveeduría | Punto de venta para comida y artículos | USD 100 |
| **Total** | | **USD 700** |

---

## 1. Guardería — USD 300

Control de las embarcaciones/vehículos que los clientes dejan guardados, organizados por lugar.

- **Vista por lugares:** cada lugar (A, B, C…) muestra qué cliente y qué embarcación está ahí, y si está al día o debe
- Lugares libres / ocupados de un vistazo
- Alta de cliente + embarcación que deja en guardería, asignada a un lugar
- Fecha de ingreso y egreso
- Tarifa mensual configurable
- Estado: en guardería / retirada
- Cobro mensual recurrente, integrado a la cuenta corriente del cliente
- Listado de quién está al día y quién debe

---

## 2. Turnera de alquiler de lanchas — USD 300

Agenda de turnos para alquilar las lanchas por hora/día.

- Calendario de turnos (disponible / ocupado)
- Reserva de turno por cliente
- Precio por turno configurable
- Control de qué lancha está alquilada y cuándo vuelve
- Cobro integrado a la caja

*Es el módulo más laborioso: el calendario es desarrollo nuevo.*

---

## 3. Proveeduría — USD 100

Punto de venta rápido para vender comida, bebidas y artículos.

- Venta rápida de productos (reutiliza el sistema de productos y stock actual)
- Cobro directo a caja
- Control de stock de la proveeduría

*Precio bajo porque aprovecha gran parte de lo que ya está hecho.*

---

## Condiciones

- Todo se integra al sistema actual: un solo login, una sola caja, una sola base de clientes.
- Se puede contratar por módulo separado si se prefiere arrancar con uno.
- No incluye: hardware (lectores, impresoras, etc.).
