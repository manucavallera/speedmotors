// @contract: Créditos cuenta corriente. credits → clients + users. payments y interestCharges → credits. Interés mensual lazy sobre saldo.
import { pgTable, serial, integer, numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { creditStatusEnum, creditCurrencyEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'

export const credits = pgTable('credits', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  currency: creditCurrencyEnum('currency').notNull().default('pesos'),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  status: creditStatusEnum('status').notNull().default('activo'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const creditPayments = pgTable('credit_payments', {
  id: serial('id').primaryKey(),
  creditId: integer('credit_id').references(() => credits.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const creditInterestCharges = pgTable('credit_interest_charges', {
  id: serial('id').primaryKey(),
  creditId: integer('credit_id').references(() => credits.id).notNull(),
  chargeDate: timestamp('charge_date').notNull(),
  balanceBefore: numeric('balance_before', { precision: 12, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
