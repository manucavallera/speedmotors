// @contract: Tabla reservations. reservations → clients? + users.
import { pgTable, serial, integer, varchar, numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { reservationStatusEnum, vehicleTypeEnum } from './enums'
import { clients } from './clients.schema'
import { users } from './users.schema'

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  reservationNumber: varchar('reservation_number', { length: 20 }),
  date: timestamp('date').notNull().defaultNow(),
  clientId: integer('client_id').references(() => clients.id),
  clientName: varchar('client_name', { length: 100 }).notNull(),
  clientDni: varchar('client_dni', { length: 20 }),
  clientAddress: varchar('client_address', { length: 200 }),
  clientPhone: varchar('client_phone', { length: 30 }),
  spouseName: varchar('spouse_name', { length: 100 }),
  spouseDni: varchar('spouse_dni', { length: 20 }),
  vehicleType: vehicleTypeEnum('vehicle_type').notNull().default('moto'),
  brand: varchar('brand', { length: 50 }).notNull(),
  model: varchar('model', { length: 50 }),
  year: integer('year'),
  color: varchar('color', { length: 30 }),
  motorNumber: varchar('motor_number', { length: 80 }),
  chassisNumber: varchar('chassis_number', { length: 80 }),
  price: numeric('price', { precision: 12, scale: 2 }),
  depositAmount: numeric('deposit_amount', { precision: 12, scale: 2 }),
  notes: text('notes'),
  status: reservationStatusEnum('status').notNull().default('vigente'),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
