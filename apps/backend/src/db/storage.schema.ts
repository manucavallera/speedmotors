// @contract: Guardería náutica. storageSpots = lugares fijos (A1, B2...). storageUnits = embarcación guardada → client + spot. storageCharges = cobros generados → storageUnit + user. Tarifa flexible (mensual/diaria, la decide el usuario al cobrar).
import { pgTable, serial, integer, varchar, numeric, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { storageUnitStatusEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'

// Lugares físicos de la guardería (predefinidos, ej: A1..E6)
export const storageSpots = pgTable('storage_spots', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  label: varchar('label', { length: 50 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Embarcación/vehículo guardado por un cliente en un lugar
export const storageUnits = pgTable('storage_units', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  spotId: integer('spot_id').references(() => storageSpots.id),
  description: varchar('description', { length: 150 }).notNull(),
  rate: numeric('rate', { precision: 12, scale: 2 }).notNull().default('0'),
  entryDate: timestamp('entry_date').notNull().defaultNow(),
  exitDate: timestamp('exit_date'),
  status: storageUnitStatusEnum('status').notNull().default('en_guarderia'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Catálogo de servicios anexos configurable (seguro, lavado, puesta en marcha, alquiler batería, etc.)
export const storageServices = pgTable('storage_services', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Cobro generado por una unidad guardada (entra a caja + cta cte del cliente)
export const storageCharges = pgTable('storage_charges', {
  id: serial('id').primaryKey(),
  storageUnitId: integer('storage_unit_id').references(() => storageUnits.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  periodLabel: varchar('period_label', { length: 40 }),
  chargeDate: timestamp('charge_date').notNull().defaultNow(),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Detalle de un cobro: cuna mensual + cada servicio anexo (concept = etiqueta, serviceId si vino del catálogo)
export const storageChargeItems = pgTable('storage_charge_items', {
  id: serial('id').primaryKey(),
  chargeId: integer('charge_id').references(() => storageCharges.id, { onDelete: 'cascade' }).notNull(),
  concept: varchar('concept', { length: 120 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  serviceId: integer('service_id').references(() => storageServices.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
