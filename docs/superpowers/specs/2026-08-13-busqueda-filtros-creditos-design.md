# Diseño: búsqueda y filtros escalables de créditos

## Objetivo

Permitir encontrar rápidamente la deuda de un cliente y filtrar la pestaña `Créditos` por tipo de financiación, incluso cuando existan muchos registros.

La búsqueda, los filtros y la paginación se resolverán en el servidor. La interfaz no descargará ni calculará todos los créditos para luego ocultarlos localmente.

## Experiencia de usuario

La pantalla conservará el filtro actual por estado y agregará:

- un campo `Buscar cliente`;
- un selector `Tipo de deuda`;
- paginación de 50 registros por página;
- total de resultados coincidentes.

Los filtros pueden combinarse. Por ejemplo, el usuario podrá consultar simultáneamente créditos `Activos`, de `Cuota libre`, cuyo cliente coincida con `Gómez`.

### Búsqueda por cliente

- Busca por nombre del cliente.
- Ignora mayúsculas, minúsculas y acentos.
- El texto se envía después de 300 ms sin escribir para evitar una solicitud por tecla.
- Cambiar la búsqueda vuelve automáticamente a la primera página.
- Limpiar el campo restaura todos los clientes compatibles con los demás filtros.

### Tipo de deuda

Las opciones visibles serán:

- `Todos los tipos`;
- `Financiación fija`;
- `Cuota libre`;
- `Cuenta corriente`.

La clasificación usa los datos existentes:

- `Financiación fija`: `creditType = cuotas_simples`;
- `Cuota libre`: `creditType = saldo_compuesto` e `interestRate > 0`;
- `Cuenta corriente`: `creditType = saldo_compuesto` e `interestRate = 0`.

No se agrega un nuevo tipo a la base de datos.

### Estados y resultados vacíos

El filtro existente de estado (`Todos`, `Activo`, `Pagado`, `Cancelado`) se combina con búsqueda y tipo. Cambiar estado o tipo vuelve a la primera página.

Si no existen coincidencias, la tabla mostrará `No hay créditos para estos filtros`, diferenciándolo de la carga inicial.

## API

`GET /credits` aceptará:

- `status`: `activo | pagado | cancelado`;
- `search`: texto libre del nombre del cliente;
- `debtType`: `fija | libre | cuenta_corriente`;
- `page`: entero positivo, por defecto `1`;
- `limit`: entero entre `1` y `100`, por defecto `50`.

La respuesta cambiará de un arreglo plano a:

```ts
interface PaginatedCreditsResponse {
  items: Credit[]
  total: number
  page: number
  pages: number
}
```

El frontend de Créditos se actualizará en el mismo despliegue para consumir el contrato paginado.

## Backend

El controlador validará y normalizará los parámetros antes de pasarlos al servicio. Valores inválidos de estado, tipo, página o límite devolverán HTTP 400 con un mensaje claro.

El servicio construirá una consulta con:

- unión con clientes;
- coincidencia de nombre sin distinguir mayúsculas ni acentos;
- condiciones por estado y clasificación de deuda;
- conteo total bajo los mismos filtros;
- `limit` y `offset` estables;
- orden por creación descendente y `id` descendente como desempate.

Sólo se calculará el saldo de los registros de la página solicitada. Esto evita el costo actual de calcular todos los saldos cuando la tabla crece.

La búsqueda sin acentos no dependerá de la extensión `unaccent`. El servidor normalizará el texto recibido con Unicode NFD y eliminará marcas diacríticas. La consulta aplicará `translate(lower(client.name), 'áéíóúüñ', 'aeiouun')` antes de comparar. Esto cubre los nombres en español soportados por la aplicación sin instalar extensiones ni ejecutar migraciones.

## Frontend

`useCredits` será la fuente única de:

- estado seleccionado;
- tipo de deuda;
- búsqueda escrita y búsqueda estabilizada;
- página actual;
- respuesta paginada.

La clave de React Query incluirá todos los parámetros para evitar mezclar resultados entre filtros. La pantalla utilizará el componente de paginación existente.

Mientras se obtiene una nueva combinación, se conservará visualmente la página anterior como dato temporal, sin permitir que el usuario confunda el total anterior con el nuevo: se mostrará estado de actualización.

## Errores y límites

- Los filtros no modifican créditos; son operaciones de lectura.
- Una respuesta tardía de una búsqueda anterior no reemplazará la combinación actual gracias a las claves de React Query.
- Página fuera de rango devolverá `items: []` con el total y cantidad de páginas reales. Si `total > 0` y la página solicitada supera `pages`, el frontend seleccionará exactamente `pages` y repetirá la consulta una sola vez.
- Error de red conserva los filtros ingresados y permite reintentar.
- No se crea ni modifica ninguna migración.

## Pruebas

### Backend

- busca por nombre sin distinguir mayúsculas ni acentos;
- combina búsqueda, estado y tipo;
- distingue fija, libre y cuenta corriente mediante `creditType` e interés;
- pagina con orden estable y devuelve total/páginas correctos;
- calcula saldos sólo para los elementos de la página;
- aplica valores por defecto y rechaza parámetros inválidos.

### Frontend

- construye los parámetros correctos para cada combinación;
- cambiar búsqueda, estado o tipo vuelve a página 1;
- estabiliza la búsqueda antes de consultar;
- consume `items`, `total`, `page` y `pages`;
- muestra el mensaje vacío específico y controles de paginación;
- conserva el comportamiento de creación, detalle, edición y pagos.

## Criterios de aceptación

1. Escribir parte del nombre de un cliente muestra sólo sus créditos.
2. Se puede filtrar por financiación fija, cuota libre o cuenta corriente.
3. Búsqueda, tipo y estado funcionan simultáneamente.
4. La pantalla muestra 50 resultados por página y permite navegar por todas las coincidencias.
5. El total refleja la combinación activa de filtros.
6. La búsqueda no distingue mayúsculas ni acentos.
7. Con muchos créditos, el servidor sólo calcula los saldos de la página solicitada.
8. Crear, consultar, editar, cobrar o eliminar créditos conserva su comportamiento actual.
9. La implementación no requiere migración de base de datos.
