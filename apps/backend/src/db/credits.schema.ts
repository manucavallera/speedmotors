// @contract: Créditos cuenta corriente. credits → clients + users. payments y interestCharges → credits. Dos modelos: saldo_compuesto (interés mensual lazy) o cuotas_simples (cuotas planificadas con vencimiento configurable).
import { pgTable, serial, integer, numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { creditStatusEnum, creditCurrencyEnum, creditTypeEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'
import { sales } from './sales.schema'

export const credits = pgTable('credits', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  saleId: integer('sale_id').references(() => sales.id),
  creditType: creditTypeEnum('credit_type').notNull().default('saldo_compuesto'),
  currency: creditCurrencyEnum('currency').notNull().default('pesos'),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  firstDueDate: timestamp('first_due_date'),
  installmentsCount: integer('installments_count'),
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

export const creditCapitalAdditions = pgTable('credit_capital_additions', {
  id: serial('id').primaryKey(),
  creditId: integer('credit_id').references(() => credits.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  effectiveDate: timestamp('effective_date').notNull(),
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

// Cuotas planificadas (solo para creditType = 'cuotas_simples')
export const creditInstallments = pgTable('credit_installments', {
  id: serial('id').primaryKey(),
  creditId: integer('credit_id').references(() => credits.id, { onDelete: 'cascade' }).notNull(),
  number: integer('number').notNull(),
  dueDate: timestamp('due_date').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  principalAmount: numeric('principal_amount', { precision: 12, scale: 2 }),
  surcharge: numeric('surcharge', { precision: 12, scale: 2 }).notNull().default('0'),
  paidAt: timestamp('paid_at'),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
