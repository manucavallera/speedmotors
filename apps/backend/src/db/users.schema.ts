// @contract: Tabla users. FK: role → enums.roleEnum. Referenciada por sales, quotes, cashSessions, cashMovements, stockMovements, purchaseOrders, expenses.
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core'
import { roleEnum } from './enums'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').default('vendedor').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
