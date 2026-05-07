// @contract: Tabla client_payments. Pagos a cuenta, notas de crédito/débito manuales. → clients + users.
import { pgTable, serial, integer, numeric, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { clientPaymentTypeEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'

export const clientPayments = pgTable('client_payments', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: clientPaymentTypeEnum('type').notNull().default('pago_cuenta'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  description: varchar('description', { length: 255 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
