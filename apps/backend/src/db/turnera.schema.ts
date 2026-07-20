// @contract: Turnera = agenda de botaduras. rentalSlots = el cliente avisa día + franja horaria para meter SU lancha (storageUnits, de guardería) al agua, para que no se encimen dos. Cobro opcional de servicio (puesta en marcha) → caja. Clientes del pool marina (clients type guarderia).
import { pgTable, serial, integer, varchar, numeric, text, date, timestamp } from 'drizzle-orm/pg-core'
import { rentalSlotStatusEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'
import { storageUnits, storageServices } from './storage.schema'

// Config de la grilla (fila única). El dueño define cada cuántos minutos es un turno y el horario del día.
export const turneraConfig = pgTable('turnera_config', {
  id: integer('id').primaryKey().default(1),
  intervalMin: integer('interval_min').notNull().default(10),
  dayStart: varchar('day_start', { length: 5 }).notNull().default('07:00'),
  dayEnd: varchar('day_end', { length: 5 }).notNull().default('20:00'),
  // Teléfono de la marina (con código país, solo dígitos): el cliente le avisa por WhatsApp al reservar
  whatsapp: varchar('whatsapp', { length: 30 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Servicios pedidos en un turno: batería, combustible, parrilla... El precio del turno es la suma.
export const rentalSlotItems = pgTable('rental_slot_items', {
  id: serial('id').primaryKey(),
  slotId: integer('slot_id').references(() => rentalSlots.id, { onDelete: 'cascade' }).notNull(),
  serviceId: integer('service_id').references(() => storageServices.id),
  concept: varchar('concept', { length: 120 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const rentalSlots = pgTable('rental_slots', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => storageUnits.id).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  userId: integer('user_id').references(() => users.id),
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
