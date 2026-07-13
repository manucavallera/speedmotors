// @contract: Guardería náutica. storageSpots = cunas fijas, 48 por línea (A1..A48, B1..B48, C, D; C y D inactivas hasta que se haga el piso). storageUnits = embarcación guardada → client + spot + category. storageCategories = escalas por HP/eslora que definen la tarifa mensual. storageCharges = cobros generados → storageUnit + user.
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

// Categorías de embarcación: la escala (HP y/o eslora) define la tarifa mensual de cuna
export const storageCategories = pgTable('storage_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 60 }).notNull(),
  minHp: integer('min_hp'),
  maxHp: integer('max_hp'),
  minLength: numeric('min_length', { precision: 5, scale: 2 }),
  maxLength: numeric('max_length', { precision: 5, scale: 2 }),
  monthlyRate: numeric('monthly_rate', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Embarcación/vehículo guardado por un cliente en un lugar
export const storageUnits = pgTable('storage_units', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  spotId: integer('spot_id').references(() => storageSpots.id),
  categoryId: integer('category_id').references(() => storageCategories.id),
  description: varchar('description', { length: 150 }).notNull(),
  hp: integer('hp'),
  lengthM: numeric('length_m', { precision: 5, scale: 2 }),
  // Precio efectivo de la cuna: arranca en el de la categoría, editable por excepción
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

// Servicios fijos de una lancha: se cobran todos los meses junto con la cuna (ej: seguros)
export const storageUnitServices = pgTable('storage_unit_services', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => storageUnits.id, { onDelete: 'cascade' }).notNull(),
  serviceId: integer('service_id').references(() => storageServices.id).notNull(),
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
