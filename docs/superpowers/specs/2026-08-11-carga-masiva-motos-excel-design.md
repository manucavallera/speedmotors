# Diseño: carga masiva de motos por remito y Excel

**Fecha:** 2026-08-11  
**Estado:** aprobado para planificación

## Objetivo

Permitir que un administrador cargue varias motos en una sola operación desde un remito, una plantilla Excel o una tabla manual. Todos los caminos deben terminar en la misma revisión editable antes de insertar vehículos.

## Estado actual

- El remito ya acepta una imagen o PDF y el backend devuelve varias motos en `items[]`.
- La pantalla permite revisar, agregar y quitar filas antes de usar `POST /vehicles/bulk`.
- La carga manual múltiple ya reutiliza esa tabla.
- La interfaz menciona “Excel/Remito”, pero el selector solo acepta imágenes y PDF. Excel no está implementado.
- La acción solo está disponible para administradores.

## Enfoques considerados

1. **Plantilla descargable + importación Excel + remito existente (elegido).** Columnas previsibles, validación clara y un único flujo de revisión.
2. **Aceptar cualquier Excel del proveedor.** Evita adaptar el archivo, pero requiere mapeo de columnas y produce resultados ambiguos entre proveedores.
3. **Exportar el stock actual.** Sirve para reportes, pero no resuelve la carga de motos nuevas.

El primer enfoque cubre el pedido con menor riesgo y reutiliza la librería `xlsx`, la tabla de revisión y el endpoint masivo existentes.

## Experiencia de usuario

La acción actual pasa a llamarse **Carga masiva de motos**. Su primer paso ofrece tres caminos:

- **Remito:** seleccionar JPG, PNG, WebP o PDF y analizar todas sus filas.
- **Excel:** descargar la plantilla o seleccionar un archivo `.xlsx`, `.xls` o `.csv` completado desde esa plantilla.
- **Manual:** comenzar con una fila vacía y agregar las necesarias.

Los tres caminos abren la misma pantalla **Revisar motos**. Allí el usuario puede:

- editar cualquier dato detectado o importado;
- agregar y quitar filas;
- indicar un número de remito común para el lote;
- indicar un tipo de ingreso común para el lote;
- confirmar la cantidad total que se importará.

El número de remito y el tipo de ingreso son datos del lote, no columnas del Excel. Pueden quedar vacíos.

## Contrato de la plantilla Excel

La plantilla contiene una hoja `Motos`, una fila de encabezados y una fila de ejemplo que no se importa. Las columnas son:

| Columna | Obligatoria | Destino |
| --- | --- | --- |
| Código interno | Sí | `internalCode` |
| Código proveedor | No | `importCode` |
| Marca | Sí | `brand` |
| Modelo | Sí | `model` |
| Cilindrada | No | `displacement` |
| Versión | No | `version` |
| Color | No | `color` |
| Chasis | Sí | `chassisNumber` |
| Motor | Sí | `engineNumber` |

El importador normaliza mayúsculas/minúsculas, espacios y acentos de los encabezados. Acepta los encabezados de la plantilla; no intenta inferir formatos arbitrarios de proveedores en esta versión.

Filas completamente vacías se ignoran. La cilindrada vacía queda como `null`; si tiene valor, debe ser un número no negativo.

## Arquitectura y flujo de datos

El frontend genera la plantilla y procesa el Excel con la dependencia `xlsx` ya instalada. No se agrega un endpoint de archivos ni una migración.

Cada origen se adapta a un mismo borrador de vehículo:

1. Remito: `POST /vehicles/parse-remito` transforma imagen/PDF en borradores.
2. Excel: un parser local transforma filas de la hoja `Motos` en borradores.
3. Manual: se crea un borrador vacío.
4. La tabla de revisión edita los borradores.
5. Al confirmar, el frontend normaliza el lote y llama a `POST /vehicles/bulk`.
6. El backend valida duplicados e inserta el lote en una sola operación.

La lógica de Excel debe quedar aislada de la presentación para poder probarla sin renderizar el modal.

## Validaciones y errores

Antes de enviar:

- debe existir al menos una fila útil;
- código interno, marca, modelo, chasis y motor son obligatorios en cada fila;
- códigos internos no pueden repetirse dentro del lote;
- cilindrada debe ser numérica y no negativa;
- encabezados obligatorios deben existir;
- archivos sin hoja o sin datos muestran un error específico.

El backend conserva la validación contra códigos internos existentes. Si cualquier fila falla, el lote completo se rechaza; no hay importaciones parciales. Los errores de archivo se muestran antes de abrir la revisión y los errores de filas identifican su número.

## Seguridad y permisos

- Solo administradores ven y usan la carga masiva.
- El frontend no reemplaza controles del backend: `POST /vehicles/bulk` y `POST /vehicles/parse-remito` mantienen `AdminGuard`.
- Excel se procesa localmente en el navegador y no se almacena en el servidor.

## Pruebas

- Generación de plantilla con hoja y encabezados esperados.
- Lectura de `.xlsx` y `.csv` válidos con varias motos.
- Normalización de encabezados, espacios, valores vacíos y cilindrada.
- Rechazo de archivo vacío, encabezados faltantes, fila incompleta, cilindrada inválida y códigos repetidos.
- Adaptación del remito con varias motos a la misma tabla de revisión.
- Envío de todas las filas revisadas en una única llamada masiva.
- Errores del backend conservan abierto el modal y no muestran éxito falso.

## Criterios de aceptación

1. Un administrador puede cargar un remito con varias motos y revisar todas antes de confirmar.
2. Puede descargar una plantilla Excel, completarla y volver a importarla.
3. Excel, remito y carga manual comparten la misma revisión y validaciones.
4. Un lote válido crea todas sus motos; un lote inválido no crea ninguna.
5. La pantalla deja de afirmar que acepta Excel sin ofrecer realmente esa opción.

## Fuera de alcance

- Interpretar automáticamente cualquier formato Excel de proveedores.
- Exportar el inventario actual o generar reportes de stock.
- Importaciones parciales.
- Cambios de esquema de base de datos.
