# Financiación por tercero y consignaciones

## Alcance aprobado

En ventas se agrega el tipo `financiado_tercero`. Al seleccionarlo, el formulario exige el nombre libre de la financiera y lo guarda en la venta. Las ventas existentes y la lógica actual de créditos no cambian.

En vehículos se agrega el estado `reventa`, aplicable a motos consignadas a un negocio. Se registra el negocio, la moto consignada, fecha de entrega, precio acordado y los datos de venta cuando el negocio informa que la vendió. La pantalla de Reventas permite cargar negocios y consultar sus motos.

## Decisiones

- El nombre de la financiera es texto libre.
- El negocio reventa es una entidad propia, no un cliente de ventas.
- Una moto en consignación pasa a estado `reventa` y no aparece como disponible para vender/reservar.
- Al registrar la venta de consignación, la moto pasa a `vendido` y conserva el historial de la operación.
