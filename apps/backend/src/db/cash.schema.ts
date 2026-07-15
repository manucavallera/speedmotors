// @contract: Tablas cashSessions + cashMovements. cashSessions → users. cashMovements → cashSessions + users. Solo una sesión abierta a la vez.
import { pgTable, serial, integer, numeric, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { cashSessionStatusEnum, cashMovementTypeEnum, cashAreaEnum } from './enums'
import { users } from './users.schema'

export const cashSessions = pgTable('cash_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: cashSessionStatusEnum('status').notNull().default('abierta'),
  area: cashAreaEnum('area').notNull().default('speedmotors'),
  openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  closingBalance: numeric('closing_balance', { precision: 12, scale: 2 }),
  expectedBalance: numeric('expected_balance', { precision: 12, scale: 2 }),
  countedBalance: numeric('counted_balance', { precision: 12, scale: 2 }),
  difference: numeric('difference', { precision: 12, scale: 2 }),
  notes: text('notes'),
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
})

export const cashMovements = pgTable('cash_movements', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => cashSessions.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: cashMovementTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
