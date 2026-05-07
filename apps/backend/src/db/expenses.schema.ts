// @contract: Tabla expenses. Gastos operativos de la agencia. → users. category: alquiler|servicios|compras|sueldos|impuestos|otros.
import { pgTable, serial, integer, numeric, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { expenseCategoryEnum } from './enums'
import { users } from './users.schema'

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  category: expenseCategoryEnum('category').notNull().default('otros'),
  description: varchar('description', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  date: timestamp('date').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
