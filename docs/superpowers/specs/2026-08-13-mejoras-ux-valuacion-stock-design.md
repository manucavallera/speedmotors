# Diseño: mejoras de uso para valuación de stock

## Objetivo

Hacer evidente la relación entre `Valuación de stock` y `Motos y Lanchas`, mostrar qué unidades forman cada grupo y mantener las acciones del cierre visibles durante la edición.

La valuación seguirá operando por marca, modelo y versión. La administración y eliminación de unidades continuará perteneciendo al inventario para evitar borrar motos accidentalmente durante un cierre mensual.

## Experiencia de usuario

### Acciones principales

La pantalla tendrá una barra de acciones visible en la parte superior con:

- `Gestionar motos`, que navega a `/vehicles`;
- `Actualizar stock`, que vuelve a consultar el inventario y descarta cualquier previsualización vencida;
- `Previsualizar cierre`, bloqueado mientras existan valores inválidos;
- `Confirmar cierre`, visible únicamente después de una previsualización válida.

La barra permanecerá accesible al desplazarse por una tabla extensa. El resumen inferior conservará los totales, pero dejará de ser el único lugar desde donde iniciar o confirmar el cierre.

### Detalle de los grupos

Cada fila agrupada tendrá una acción `Ver motos`. Al desplegarla mostrará las unidades incluidas con:

- código interno;
- marca, modelo y versión;
- estado disponible o reservado;
- número de cuadro y motor cuando estén informados;
- enlace `Editar`, que abre la gestión de esa unidad en `Motos y Lanchas`.

No habrá una acción `Eliminar` dentro de la valuación. La eliminación se realizará desde la ficha del vehículo, con la confirmación existente. Al volver o actualizar el stock, una unidad eliminada dejará de integrar el grupo.

El detalle sólo incluye las motos elegibles que ya forman parte del grupo. Las vendidas y las lanchas no aparecen.

### Estado del período y cambios

Junto al selector de período se mostrará uno de estos estados:

- `Sin cerrar` cuando todavía no existe cierre;
- `Cerrado` con fecha y hora cuando existe;
- `Con cambios sin previsualizar` después de modificar algún valor;
- `Previsualización lista` cuando el servidor validó los valores actuales.

Cada grupo indicará si cambia el costo, el precio de venta, ambos o ninguno. Si el período ya tiene cierre, la interfaz advertirá antes de previsualizar que la confirmación reemplazará la fotografía existente; el reemplazo conservará la segunda confirmación explícita actual.

## Datos y arquitectura

El endpoint que entrega el stock actual agregará a cada grupo un resumen de sus unidades. Se expondrán únicamente los campos necesarios para identificar y editar la moto; no se enviarán datos sensibles ni información ajena al cierre.

El frontend mantendrá tres responsabilidades separadas:

- la página coordina navegación, actualización y estado del período;
- el editor representa grupos, unidades desplegables y cambios de precios;
- la barra de acciones controla previsualización, confirmación y actualización.

`Actualizar stock` invalidará la consulta de valuación y solicitará nuevamente los datos al backend. Si hay cambios locales sin confirmar, pedirá confirmación antes de descartarlos. Cualquier modificación posterior a una previsualización la invalidará y ocultará `Confirmar cierre` hasta calcularla otra vez.

Para `Editar`, la navegación llevará a `/vehicles` con el identificador de la unidad en la URL. La pantalla de vehículos localizará esa unidad y abrirá su formulario de edición. Al guardar o cancelar, el administrador podrá volver a la valuación conservando el período seleccionado. Si la apertura directa no puede resolverse, se mostrará la lista filtrada por el código interno de la moto.

No se requieren cambios de base de datos: los datos de las unidades ya existen en `vehicles` y el historial continuará guardando sólo la fotografía agregada del grupo.

## Errores y seguridad

- Sólo administradores pueden consultar el detalle de unidades y operar la valuación.
- Si una moto deja de ser elegible antes del cierre, el control de concurrencia actual rechazará la operación y pedirá actualizar el stock.
- Si falla la actualización, se conservan los valores locales y se muestra el error.
- Si una unidad ya no existe al abrir `Editar`, se informa y se vuelve a la lista de vehículos.
- Las acciones deshabilitadas explican qué dato falta o por qué debe repetirse la previsualización.

## Pruebas

### Backend

- el grupo devuelve exclusivamente sus motos disponibles y reservadas;
- no filtra unidades de otro grupo ni expone lanchas o vendidas;
- mantiene la detección de stock cambiado antes del cierre;
- conserva el contrato actual de cálculo y persistencia.

### Frontend

- despliega y contrae las unidades de un grupo;
- muestra identificación, estado y enlace de edición correctos;
- `Gestionar motos` abre el inventario;
- `Actualizar stock` recarga directamente cuando no hay cambios y pide confirmación cuando los hay;
- modificar un valor invalida la previsualización;
- la barra muestra `Previsualizar` y sólo habilita `Confirmar` con una previsualización vigente;
- muestra correctamente los estados de período y los indicadores de cambios;
- abrir una URL de edición localiza la unidad correspondiente.

## Criterios de aceptación

1. Un administrador puede ver cuáles son las cuatro unidades incluidas en un grupo como Guerrero Trip.
2. Puede abrir la edición de una unidad desde el grupo sin confundirla con una acción propia del cierre.
3. No puede eliminar motos accidentalmente desde `Valuación de stock`.
4. Las acciones de previsualización y confirmación permanecen visibles durante la edición.
5. La pantalla identifica claramente si el período está cerrado y si la previsualización sigue vigente.
6. Actualizar el stock refleja altas, ediciones, eliminaciones y cambios de estado.
7. Nada se persiste hasta confirmar el cierre.
8. La mejora no requiere una nueva migración de base de datos.
