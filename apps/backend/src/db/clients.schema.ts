// @contract: Tabla clients. Sin dependencias externas. Referenciada por sales y quotes via clientId.
import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { clientTypeEnum } from './enums'

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  type: clientTypeEnum('type').notNull().default('concesionaria'),
  name: varchar('name', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 150 }),
  dni: varchar('dni', { length: 20 }),
  cuit: varchar('cuit', { length: 20 }),
  condicionIva: varchar('condicion_iva', { length: 50 }).default('consumidor_final'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
