// @contract: Cierres mensuales inmutables de la valuación de motos disponibles y reservadas.
import { index, integer, numeric, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

export const stockValuations = pgTable('stock_valuations', {
  id: serial('id').primaryKey(),
  period: varchar('period', { length: 7 }).notNull(),
  closedAt: timestamp('closed_at').defaultNow().notNull(),
  availableUnits: integer('available_units').notNull(),
  reservedUnits: integer('reserved_units').notNull(),
  totalUnits: integer('total_units').notNull(),
  totalCost: numeric('total_cost', { precision: 14, scale: 2 }).notNull(),
  totalSell: numeric('total_sell', { precision: 14, scale: 2 }).notNull(),
  potentialMargin: numeric('potential_margin', { precision: 14, scale: 2 }).notNull(),
  unpricedSaleUnits: integer('unpriced_sale_units').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('stock_valuations_period_unique').on(table.period),
])

export const stockValuationLines = pgTable('stock_valuation_lines', {
  id: serial('id').primaryKey(),
  valuationId: integer('valuation_id')
    .references(() => stockValuations.id, { onDelete: 'cascade' })
    .notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  version: varchar('version', { length: 100 }),
  availableUnits: integer('available_units').notNull(),
  reservedUnits: integer('reserved_units').notNull(),
  totalUnits: integer('total_units').notNull(),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  sellPrice: numeric('sell_price', { precision: 12, scale: 2 }),
  totalCost: numeric('total_cost', { precision: 14, scale: 2 }).notNull(),
  totalSell: numeric('total_sell', { precision: 14, scale: 2 }).notNull(),
  potentialMargin: numeric('potential_margin', { precision: 14, scale: 2 }).notNull(),
}, (table) => [
  index('stock_valuation_lines_valuation_idx').on(table.valuationId),
])
