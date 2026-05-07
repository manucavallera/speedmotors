# Architecture Map -- SpeedMotors

## Flujo de datos
Browser -> React 19 (Vite :5173)
       -> axios (api.ts) -> Authorization: Bearer JWT
       -> NestJS 11 (:3000)
       -> Drizzle ORM
       -> PostgreSQL (Docker speedmotors-db :5432)

## Monorepo
speedmotors/
  apps/
    backend/src/
      auth/           JWT login, guards, strategy
      clients/        CRUD clientes (name, dni, cuit, condicion_iva)
      products/       CRUD productos + import Excel + upload foto
      vehicles/       CRUD motos/lanchas (ingresoTipo, importCode)
      sales/          Ventas contado/cuotas, invoice_type A/B/X
      installments/   Cuotas de ventas
      quotes/         Presupuestos
      cash/           Sesiones de caja + movimientos
      expenses/       Gastos
      stock-movements/ Entradas/salidas/ajustes de stock
      purchase-orders/ OC a proveedores
      reports/        Reportes agregados
      upload/         Multer para fotos de productos
      db/
        schema.ts     FUENTE DE VERDAD -- todas las tablas Drizzle
        seeds/seed.ts
    frontend/src/
      pages/          Una page por modulo
      components/ui/  Modal, FormField, QRModal, InfoBanner
      lib/
        api.ts        axios instance con JWT interceptor
        pdf.ts        jsPDF: recibo, factura, remito, lista precios

## Tablas principales
users            id, name, email, password_hash, role(admin|vendedor)
clients          id, name, phone, dni, cuit, condicion_iva
products         id, code, name, brand, cost_price, sell_price, stock, ingreso_tipo
vehicles         id, type(moto|lancha), brand, model, chassis_number, engine_number,
                 import_code, ingreso_tipo, status(disponible|reservado|vendido)
sales            id, sale_number, client_id, invoice_type(A|B|X), type(contado|cuotas),
                 total, payment_method, status
sale_items       id, sale_id, product_id?, vehicle_id?, description, quantity, unit_price
installments     id, sale_id, number, amount, due_date, status(pendiente|pagado|vencido)
cash_sessions    id, user_id, status(abierta|cerrada), opening_balance, closing_balance
purchase_orders  id, supplier_id, status(borrador|enviada|recibida|cancelada)
expenses         id, category, description, amount, date

## Auth
POST /auth/login -> { access_token: JWT }
JWT payload: { sub: userId, email, role }
Guard: JwtAuthGuard en todos los endpoints excepto /auth/login
