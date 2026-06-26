// @contract: Turnera = agenda de botaduras. rentalSlots = el cliente avisa día + franja horaria para meter SU lancha (storageUnits, de guardería) al agua, para que no se encimen dos. Cobro opcional de servicio (puesta en marcha) → caja. Clientes del pool marina (clients type guarderia).
import { pgTable, serial, integer, varchar, numeric, text, date, timestamp } from 'drizzle-orm/pg-core'
import { rentalSlotStatusEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'
import { storageUnits, storageServices } from './storage.schema'

export const rentalSlots = pgTable('rental_slots', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => storageUnits.id).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  serviceId: integer('service_id').references(() => storageServices.id),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  status: rentalSlotStatusEnum('status').notNull().default('reservado'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
