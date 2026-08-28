// @contract: Tablas sales + saleItems + installments. sales → clients + users. saleItems → sales + products? + vehicles?. installments → sales.
import { pgTable, serial, varchar, integer, numeric, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { saleTypeEnum, invoiceTypeEnum, paymentMethodEnum, saleStatusEnum, installmentStatusEnum } from './enums' // invoiceTypeEnum usado en sales.invoiceType
import { clients } from './clients.schema'
import { users } from './users.schema'
import { products } from './catalog.schema'
import { vehicles } from './vehicles.schema'

export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  saleNumber: varchar('sale_number', { length: 20 }),
  clientId: integer('client_id').references(() => clients.id),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: saleTypeEnum('type').notNull().default('contado'),
  invoiceType: invoiceTypeEnum('invoice_type').notNull().default('X'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  amountFormal: numeric('amount_formal', { precision: 12, scale: 2 }).notNull().default('0'),
  amountInformal: numeric('amount_informal', { precision: 12, scale: 2 }).notNull().default('0'),
  financingCurrency: varchar('financing_currency', { length: 10 }),
  financingProvider: varchar('financing_provider', { length: 120 }),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('efectivo'),
  status: saleStatusEnum('status').notNull().default('completado'),
  downPayment: numeric('down_payment', { precision: 12, scale: 2 }).notNull().default('0'),
  downPaymentMethod: varchar('down_payment_method', { length: 20 }),
  firstInstallmentDate: timestamp('first_installment_date'),
  notes: text('notes'),
  transportPropio: boolean('transport_propio').default(false),
  transportistaNombre: varchar('transportista_nombre', { length: 100 }),
  transportistaCuit: varchar('transportista_cuit', { length: 20 }),
  transportistaDomicilio: varchar('transportista_domicilio', { length: 200 }),
  conductorNombre: varchar('conductor_nombre', { length: 100 }),
  conductorDni: varchar('conductor_dni', { length: 20 }),
  conductorRegNum: varchar('conductor_reg_num', { length: 50 }),
  dominioVehiculo: varchar('dominio_vehiculo', { length: 20 }),
  dominioAcoplado: varchar('dominio_acoplado', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => sales.id).notNull(),
  productId: integer('product_id').references(() => products.id),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  ingresoTipo: varchar('ingreso_tipo', { length: 10 }),
})

export const installments = pgTable('installments', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => sales.id).notNull(),
  number: integer('number').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  paidAt: timestamp('paid_at'),
  status: installmentStatusEnum('status').notNull().default('pendiente'),
})
