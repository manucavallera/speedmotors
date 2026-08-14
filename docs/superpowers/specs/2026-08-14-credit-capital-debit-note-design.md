# Nota de débito para capital adicional

## Objetivo

Permitir que cada capital adicional de un crédito tenga un comprobante descargable, igual que los pagos registrados.

## Diseño

- El formulario de capital conserva importe y fecha, y usa `concepto` como detalle obligatorio/opcional según la validación existente.
- Al confirmar, el movimiento se guarda asociado al crédito.
- En el historial del crédito, cada movimiento de capital muestra un botón `Nota de débito`.
- El botón genera un PDF con cliente, fecha, importe, concepto y referencia al crédito.
- No se modifica el cálculo de saldo ni se crean migraciones nuevas: se reutiliza `credit_capital_additions`.

## Verificación

- Test del generador PDF y del formulario/historial.
- Build de backend y frontend.
- Comprobación manual: agregar capital y descargar la nota desde el historial.
