# Impresión sobre comprobantes preimpresos

## Propósito

Permitir que una venta se imprima sobre las facturas y remitos físicos que entrega la imprenta. El papel ya contiene su diseño, logo, numeración, CAI, recuadros y copias; el sistema debe imprimir únicamente los datos variables, alineados con los espacios en blanco.

## Alcance acordado

- Se soportan dos modelos físicos: factura y remito, basados en los PDFs entregados por el cliente.
- La factura física tendrá el mismo encabezado superior izquierdo del remito. Ese encabezado forma parte del diseño fijo que prepara la imprenta.
- El sistema no genera, reemplaza ni almacena CAI, número de comprobante ni el encabezado fijo de los formularios.
- Los PDFs completos actuales continúan disponibles como comprobantes digitales de consulta.

## Diseño

Cada comprobante tendrá un renderer de superposición con el tamaño físico de su formulario, separado de los renderers digitales actuales. La factura se genera en A4 (210 × 297 mm) y el remito en Carta (215,9 × 279,4 mm), según los PDFs de referencia. El renderer partirá de los datos de una venta y de su cliente, escribirá texto negro sin fondos ni bordes y usará coordenadas expresadas en milímetros.

Los campos se agrupan por zona para que la calibración pueda cambiar una zona sin desplazar las demás:

| Zona | Factura | Remito |
| --- | --- | --- |
| Cabecera variable | fecha, cliente, CUIT/DNI, condición IVA y domicilio | fecha, destinatario, CUIT/DNI y domicilio |
| Detalle | descripción, cantidad, precio unitario, subtotal | descripción, cantidad y observaciones |
| Totales | neto, IVA, total y forma de pago | sin importes |
| Logística | no aplica | transporte, conductor y dominio |

Cada plantilla limitará el texto al ancho del campo, ajustará las líneas del detalle al espacio disponible y avisará antes de imprimir cuando la cantidad de ítems no entre en el formulario. El remito seguirá generando una sola página de datos para que el juego físico de copias replique la impresión.

## Flujo de usuario

Desde el comprobante de una venta habrá una acción de impresión sobre formulario. Al elegir factura o remito, el sistema genera el PDF de superposición y abre el diálogo de impresión del navegador. El usuario coloca el formulario correspondiente en la bandeja; el navegador debe imprimir en el tamaño del documento y a escala real, sin encabezados ni pies de página.

El primer uso de cada plantilla incluye una acción de calibración. Genera una hoja de prueba con una grilla y etiquetas de campo para cotejarla contra una fotocopia del formulario. Una vez ajustadas las coordenadas, esa acción queda fuera del uso diario.

## Implementación prevista

- Añadir renderers de superposición en `apps/frontend/src/lib/pdf/`, usando jsPDF y el mismo origen de datos de `generateInvoice` y `generateRemito`.
- Extraer las coordenadas y utilitarios de ajuste de texto a una configuración tipada por plantilla.
- Agregar acciones explícitas de impresión preimpresa en el detalle e historial de ventas, sin modificar las acciones de PDF digital existentes.
- Añadir una prueba de calibración para cada plantilla y proteger el overflow del detalle.

## Errores y límites

- Si faltan datos obligatorios para un campo, se deja el espacio vacío; nunca se inventa un valor fiscal.
- Si no entran los ítems, la aplicación bloquea esa impresión y explica que hay que usar un formulario adicional o una versión de varias páginas previamente acordada.
- La alineación final depende del modelo de impresora, sus márgenes y la escala de impresión. La calibración se hace una vez por modelo de impresora utilizado.

## Verificación

1. Compilar el frontend y ejecutar las pruebas existentes de PDF.
2. Generar factura y remito de prueba con una venta corta y otra con el máximo de renglones permitido.
3. Imprimir sobre copias de los formularios recibidos y verificar el ajuste de cada zona.
4. Confirmar que los PDFs digitales actuales siguen sin cambios visuales.
