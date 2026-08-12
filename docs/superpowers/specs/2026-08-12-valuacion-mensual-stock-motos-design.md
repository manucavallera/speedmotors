# Diseño: actualización mensual de precios y valuación de stock de motos

## Objetivo

Permitir que un administrador actualice una sola vez el costo de reposición de cada combinación de marca, modelo y versión, aplique opcionalmente un precio de venta manual o calculado por margen, y guarde una fotografía mensual del valor del stock.

La función evita editar cada unidad por separado y conserva cierres históricos aunque después cambien precios, estados o existencias.

## Alcance por fases

### Fase 1 — sistema

- Pantalla propia de valuación dentro de Inventario.
- Agrupación exacta por marca, modelo y versión.
- Actualización masiva de costo y venta para todas las motos de cada grupo.
- Margen general y excepciones por grupo.
- Vista previa antes de confirmar.
- Cierre mensual persistente y consulta del historial.

### Fase 2 — Excel

- Exportar una planilla de actualización con una fila por marca, modelo y versión.
- Importar precios o márgenes editados.
- Reutilizar la misma validación, vista previa y confirmación de la Fase 1.

La Fase 2 no forma parte de esta implementación. El Excel existente de carga masiva sigue destinado al ingreso de motos nuevas.

## Reglas de negocio

### Stock incluido

- Sólo vehículos de tipo `moto`.
- Incluye estados `disponible` y `reservado`.
- Excluye estado `vendido`.
- La pantalla y el cierre muestran disponibles y reservadas por separado, además del total.

### Identidad del grupo

La clave funcional es:

`marca + modelo + versión`

Los valores se comparan sin distinguir mayúsculas, minúsculas ni espacios exteriores. El sistema conserva la escritura visible existente. Una versión vacía forma un grupo propio y se muestra como “Sin versión”.

Ejemplo:

- Guerrero / Trip / TA
- Guerrero / Trip / TF
- Guerrero / Trip / TBA
- Guerrero / Trip / TFE

Cada combinación recibe precios independientes. `importCode` continúa siendo un dato informativo del proveedor, no la clave de agrupación.

### Costo de reposición

- Es el dato principal y obligatorio del cierre.
- Cada grupo debe terminar con un costo mayor que cero.
- Al confirmar, el costo elegido se aplica a todas las motos disponibles y reservadas del grupo.
- Si las unidades de un grupo tienen costos actuales distintos, la pantalla muestra “Varios” y exige elegir un costo único antes de cerrar.

### Precio de venta y margen

El precio de venta es opcional. Para cada grupo puede:

1. escribirse manualmente;
2. calcularse como `costo × (1 + margen / 100)`;
3. conservarse sin cambios si no se proporciona precio ni margen.

Precedencia:

1. precio de venta manual del grupo;
2. margen específico del grupo;
3. margen general;
4. precio de venta actual sin cambios.

El margen debe estar entre 0% y 1000%. Los precios se redondean a dos decimales. Cambiar costo o margen actualiza inmediatamente la vista previa, pero nada se persiste hasta confirmar.

Si alguna unidad conserva precio de venta cero, el cierre sigue permitido. La valuación informa cuántas unidades no tienen precio de venta para evitar interpretar el total potencial como completo.

### Período y cierre

- El período usa formato `YYYY-MM` y por defecto es el mes actual.
- Puede generarse un cierre sin cambiar precios, siempre que todos los costos sean válidos.
- Sólo existe un cierre vigente por período.
- Si ya existe, el servidor devuelve conflicto. La interfaz ofrece reemplazarlo con una segunda confirmación explícita.
- Reemplazar vuelve a calcular el cierre con el stock y precios actuales; no mezcla líneas del cierre anterior.
- Todo el proceso —actualización de precios y escritura del cierre— ocurre en una transacción.

## Experiencia de usuario

### Entrada

Nueva opción `Valuación de stock` en el grupo Inventario del menú. Sólo administradores ven y operan la pantalla.

### Pantalla de trabajo

Encabezado:

- selector de período;
- margen general opcional;
- totales actuales y proyectados;
- indicador de grupos pendientes o inválidos.

Tabla editable:

- marca;
- modelo;
- versión;
- unidades disponibles;
- unidades reservadas;
- costo actual;
- costo nuevo;
- venta actual;
- modo de venta (`Sin cambio`, `Manual`, `Margen`);
- margen específico o venta manual;
- venta proyectada.

La tabla permite buscar por marca, modelo o versión. La actualización se hace por grupo, nunca por fila física de vehículo.

### Vista previa y confirmación

Antes de cerrar se muestra:

- cantidad de grupos y motos afectadas;
- cambios de costo y venta;
- capital total a costo;
- valor potencial de venta;
- margen potencial;
- unidades sin precio de venta;
- separación entre disponibles y reservadas.

Confirmar crea el cierre. Si el período ya existe, se requiere una confirmación adicional para reemplazarlo.

### Historial

La misma pantalla muestra cierres anteriores ordenados del más reciente al más antiguo. Cada cierre permite ver:

- fecha y período;
- unidades totales, disponibles y reservadas;
- capital a costo;
- valor potencial de venta;
- margen potencial;
- unidades sin precio de venta;
- detalle congelado por marca, modelo y versión.

## Arquitectura

### Backend

Crear un módulo aislado `stock-valuations` en lugar de ampliar `VehiclesService` con responsabilidades históricas.

Responsabilidades:

- agrupar stock elegible;
- validar instrucciones de precio;
- calcular la vista previa;
- actualizar vehículos dentro de una transacción;
- crear o reemplazar cierres;
- consultar historial y detalle.

Endpoints protegidos con `JwtAuthGuard` y `AdminGuard`:

- `GET /stock-valuations/preview?period=YYYY-MM`
- `POST /stock-valuations/preview`
- `POST /stock-valuations/close`
- `GET /stock-valuations`
- `GET /stock-valuations/:id`

El `GET` inicial devuelve grupos actuales. El `POST /preview` acepta los cambios propuestos y devuelve el resultado calculado sin escribir. `POST /close` repite validaciones en servidor y persiste de forma atómica; no confía en totales enviados por el navegador.

### Persistencia

Agregar dos tablas:

`stock_valuations`

- id;
- período único;
- fecha de cierre;
- cantidades disponibles, reservadas y totales;
- total a costo;
- total potencial de venta;
- margen potencial;
- unidades sin precio de venta;
- fecha de creación y actualización.

`stock_valuation_lines`

- referencia al cierre con borrado en cascada;
- marca, modelo y versión congelados;
- cantidades disponibles, reservadas y totales;
- costo unitario;
- venta unitaria, nula cuando el grupo conservó precios de venta distintos;
- total a costo;
- total potencial de venta;
- margen potencial.

Los totales de una línea siempre son la suma exacta de sus unidades, incluso cuando no existe un único precio de venta representativo. Las líneas son instantáneas: no referencian una moto concreta y no cambian cuando cambia el inventario posterior.

### Consistencia y concurrencia

La confirmación usa los identificadores de motos devueltos por la agrupación del servidor y vuelve a verificar que sigan elegibles. Si el stock cambió entre la vista previa y la confirmación, el servidor rechaza la operación con un mensaje para recargar la vista previa.

Una restricción única sobre período impide cierres duplicados. El reemplazo elimina las líneas anteriores y vuelve a escribir encabezado y detalle en la misma transacción.

### Frontend

Crear una página enfocada y componentes separados:

- página y carga de datos;
- tabla editable de grupos;
- cálculo puro de precio proyectado para respuesta inmediata;
- resumen y modal de confirmación;
- historial y detalle de cierres.

React Query administra consultas, vista previa remota, cierre e invalidación. Los cálculos visibles del navegador son orientativos; la respuesta del backend es la fuente final.

## Errores y validaciones

- período inválido: mensaje de formato;
- costo vacío, cero o negativo: marcar grupo y bloquear cierre;
- margen fuera de rango: marcar campo y bloquear vista previa;
- precio manual negativo: marcar campo;
- stock cambiado: pedir recargar;
- cierre existente: ofrecer reemplazo explícito;
- grupo sin versión: permitirlo y mostrar advertencia informativa;
- venta faltante: permitir cierre y mostrar cobertura incompleta;
- error transaccional: no actualizar precios ni guardar cierre parcialmente.

## Pruebas

### Backend

- agrupa sin distinguir mayúsculas y espacios, pero separa versiones;
- incluye disponibles y reservadas; excluye vendidas y lanchas;
- aplica precedencia manual, margen específico, margen general y sin cambio;
- calcula totales y redondeo correctamente;
- bloquea costos inválidos y márgenes fuera de rango;
- actualiza todas las unidades del grupo y ninguna de otro grupo;
- crea cierre y líneas en la misma transacción;
- evita duplicado y reemplaza sólo con autorización explícita;
- detecta cambios de stock entre vista previa y confirmación;
- conserva cierres aunque luego cambien vehículos.

### Frontend

- renderiza grupos y estados separados;
- recalcula venta proyectada al cambiar costo o margen;
- respeta prioridad de venta manual sobre márgenes;
- bloquea confirmación con errores;
- muestra conflicto y segunda confirmación para reemplazo;
- presenta totales e historial devueltos por servidor.

## Criterios de aceptación

1. Un administrador puede fijar costo para Guerrero / Trip / TA sin modificar Guerrero / Trip / TF.
2. Todas las motos disponibles y reservadas del grupo reciben el mismo costo confirmado.
3. Puede aplicar un margen general y reemplazarlo para una versión específica.
4. Puede escribir manualmente el precio de venta de un grupo.
5. Antes de confirmar ve cantidades y valores proyectados.
6. El cierre mensual guarda capital a costo, venta potencial, margen y cobertura de precio de venta.
7. Las motos vendidas y las lanchas no participan.
8. Un cierre anterior no cambia cuando luego cambia el inventario.
9. Un período no se duplica sin confirmación explícita de reemplazo.
10. Usuarios no administradores no pueden ver ni invocar la función.
