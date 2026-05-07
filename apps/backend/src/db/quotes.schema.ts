// @contract: Tablas quotes + quoteItems. Misma estructura que sales pero sin stock ni caja. quoteItems → quotes + products? + vehicles?.
import { pgTable, serial, integer, numeric, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { quoteStatusEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'
import { products } from './catalog.schema'
import { vehicles } from './vehicles.schema'

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: quoteStatusEnum('status').notNull().default('borrador'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  validUntil: timestamp('valid_until'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const quoteItems = pgTable('quote_items', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').references(() => quotes.id).notNull(),
  productId: integer('product_id').references(() => products.id),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
})
