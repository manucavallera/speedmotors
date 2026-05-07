# Learnings & decisiones de diseño -- SpeedMotors

## 2026-04-xx -- Encoding fix
Problema: caracteres especiales rotos en PDF y UI.
Decision: forzar UTF-8 en main.ts y en jsPDF.

## 2026-04-xx -- Stock bloqueado al editar producto
Decision: campo stock deshabilitado en modal de edicion.
Motivo: cambios de stock solo via StockMovements para tener trazabilidad.

## 2026-04-xx -- ingresoTipo en vehicles y products
Decision: varchar(10) nullable ('blanco'|'negro'|null).
Motivo: no todos los items tienen dato de origen; null = sin especificar.

## 2026-04-xx -- Conflicto compra/venta blanco-negro
Decision: warning visual (no bloqueo) cuando ingresoTipo='negro' + invoiceType A/B.
Motivo: el negocio puede vender en blanco algo que entro en negro; solo necesita saberlo.

## 2026-04-xx -- Selector de vehiculo en venta
Decision: optgroup con vehicles disponibles + products en mismo select por item.
Motivo: simplifica UX sin agregar un campo extra de tipo de item.

## Template para nuevas decisiones
## YYYY-MM-DD -- Titulo
Problema/contexto:
Decision:
Motivo:
