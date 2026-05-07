// @contract: Tabla reminders. reminders → users.
import { pgTable, serial, integer, numeric, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { reminderTypeEnum, reminderStatusEnum, reminderRecurrenceEnum } from './enums'
import { users } from './users.schema'

export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  type: reminderTypeEnum('type').notNull().default('otro'),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  status: reminderStatusEnum('status').notNull().default('pendiente'),
  recurrence: reminderRecurrenceEnum('recurrence').notNull().default('ninguna'),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
