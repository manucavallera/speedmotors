// @contract: Tabla transfers. Transferencia de dominio de vehículos. → vehicles + clients? + users.
import { pgTable, serial, integer, varchar, numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { transferStatusEnum } from './enums'
import { vehicles } from './vehicles.schema'
import { clients } from './clients.schema'
import { users } from './users.schema'

export const transfers = pgTable('transfers', {
  id: serial('id').primaryKey(),
  transferNumber: varchar('transfer_number', { length: 20 }),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  clientId: integer('client_id').references(() => clients.id),
  clientName: varchar('client_name', { length: 150 }).notNull(),
  clientDni: varchar('client_dni', { length: 20 }),
  date: timestamp('date').notNull().defaultNow(),
  notaryName: varchar('notary_name', { length: 150 }),
  notaryRegistry: varchar('notary_registry', { length: 100 }),
  rnpNumber: varchar('rnp_number', { length: 100 }),
  dnrpaNumber: varchar('dnrpa_number', { length: 100 }),
  transferFee: numeric('transfer_fee', { precision: 12, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }).default('0'),
  status: transferStatusEnum('status').notNull().default('pendiente'),
  notes: text('notes'),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
