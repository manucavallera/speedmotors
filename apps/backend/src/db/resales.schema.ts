import { pgTable, serial, varchar, integer, numeric, date, timestamp } from 'drizzle-orm/pg-core'
import { vehicles } from './vehicles.schema'

export const resellers = pgTable('resellers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  notes: varchar('notes', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const resaleConsignments = pgTable('resale_consignments', {
  id: serial('id').primaryKey(),
  resellerId: integer('reseller_id').references(() => resellers.id).notNull(),
  vehicleId: integer('vehicle_id').references(() => vehicles.id).notNull(),
  deliveredAt: date('delivered_at').notNull(),
  agreedPrice: numeric('agreed_price', { precision: 12, scale: 2 }).notNull(),
  soldAt: date('sold_at'),
  soldPrice: numeric('sold_price', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
