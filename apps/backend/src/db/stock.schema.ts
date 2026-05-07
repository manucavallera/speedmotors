// @contract: Tabla stockMovements. Auditoría de stock: entrada|salida|ajuste. → products + users + sales?. El stock real vive en products.stock.
import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core'
import { stockMovementTypeEnum } from './enums'
import { products } from './catalog.schema'
import { users } from './users.schema'
import { sales } from './sales.schema'

export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: stockMovementTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(),
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  reason: varchar('reason', { length: 255 }),
  saleId: integer('sale_id').references(() => sales.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
