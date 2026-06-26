// @contract: Ventas de proveeduría (POS comida/bebida). proveeduriaSales → users. items → sale + product. Descuenta products.stock y entra a caja como depósito. Productos viven en products con area='proveeduria'.
import { pgTable, serial, integer, numeric, varchar, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.schema'
import { products } from './catalog.schema'

export const proveeduriaSales = pgTable('proveeduria_sales', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const proveeduriaSaleItems = pgTable('proveeduria_sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => proveeduriaSales.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
})
