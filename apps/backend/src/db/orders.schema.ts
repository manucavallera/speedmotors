// @contract: Tablas purchaseOrders + purchaseOrderItems. purchaseOrders → suppliers? + users. purchaseOrderItems → purchaseOrders + products?.
import { pgTable, serial, integer, numeric, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { purchaseOrderStatusEnum, invoiceTypeEnum } from './enums'
import { suppliers, products } from './catalog.schema'
import { users } from './users.schema'

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: purchaseOrderStatusEnum('status').notNull().default('borrador'),
  notes: text('notes'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  amountFormal: numeric('amount_formal', { precision: 12, scale: 2 }).notNull().default('0'),
  amountInformal: numeric('amount_informal', { precision: 12, scale: 2 }).notNull().default('0'),
  expectedDate: timestamp('expected_date'),
  receivedAt: timestamp('received_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => purchaseOrders.id).notNull(),
  productId: integer('product_id').references(() => products.id),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
})
