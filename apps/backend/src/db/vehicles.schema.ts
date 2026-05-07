// @contract: Tabla vehicles. type: moto|lancha, status: disponible|reservado|vendido. Referenciada por saleItems y quoteItems via vehicleId.
import { pgTable, serial, varchar, integer, numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { vehicleTypeEnum, vehicleStatusEnum } from './enums'

export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  type: vehicleTypeEnum('type').notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year'),
  color: varchar('color', { length: 50 }),
  chassisNumber: varchar('chassis_number', { length: 100 }).unique(),
  engineNumber: varchar('engine_number', { length: 100 }),
  importCode: varchar('import_code', { length: 100 }),
  ingresoTipo: varchar('ingreso_tipo', { length: 10 }),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  sellPrice: numeric('sell_price', { precision: 12, scale: 2 }).notNull().default('0'),
  status: vehicleStatusEnum('status').notNull().default('disponible'),
  photos: text('photos').array(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
