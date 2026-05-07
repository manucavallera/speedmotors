# DB Relations Map — SpeedMotors

## Entidades clave y sus relaciones

```
users         (1:N) → sales, quotes, cashSessions, cashMovements, stockMovements, purchaseOrders, expenses
clients       (1:N) → sales, quotes
categories    (1:N) → products | (self-ref) parent/children
suppliers     (1:N) → products, purchaseOrders
products      (1:N) → saleItems, quoteItems, purchaseOrderItems, stockMovements
vehicles      (1:N) → saleItems, quoteItems
sales         (1:N) → saleItems, installments, stockMovements
quotes        (1:N) → quoteItems
cashSessions  (1:N) → cashMovements
purchaseOrders (1:N) → purchaseOrderItems
```

## FK rápidas

| Tabla hijo     | FK              | Tabla padre      |
|----------------|-----------------|------------------|
| sales          | clientId        | clients.id       |
| sales          | userId          | users.id         |
| saleItems      | saleId          | sales.id         |
| saleItems      | productId?      | products.id      |
| saleItems      | vehicleId?      | vehicles.id      |
| installments   | saleId          | sales.id         |
| quoteItems     | quoteId         | quotes.id        |
| quoteItems     | productId?      | products.id      |
| quoteItems     | vehicleId?      | vehicles.id      |
| cashMovements  | sessionId       | cashSessions.id  |
| stockMovements | productId       | products.id      |
| stockMovements | saleId?         | sales.id         |
| purchaseOrders | supplierId?     | suppliers.id     |
| purchaseOrderItems | orderId     | purchaseOrders.id|

## Enums por tabla

| Tabla        | Campo          | Enum                    |
|--------------|----------------|-------------------------|
| users        | role           | admin, vendedor         |
| vehicles     | type           | moto, lancha            |
| vehicles     | status         | disponible, reservado, vendido |
| sales        | type           | contado, cuotas         |
| sales        | paymentMethod  | efectivo, transferencia, tarjeta, mixto |
| sales        | status         | completado, pendiente, cancelado |
| sales        | invoiceType    | A, B, X                 |
| installments | status         | pendiente, pagado, vencido |
| quotes       | status         | borrador, enviado, aceptado, rechazado, vencido |
| cashSessions | status         | abierta, cerrada        |
| cashMovements| type           | retiro, deposito        |
| stockMovements| type          | entrada, salida, ajuste |
| purchaseOrders| status        | borrador, enviada, recibida, cancelada |
| expenses     | category       | alquiler, servicios, compras, sueldos, impuestos, otros |
