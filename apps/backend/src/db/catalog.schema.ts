// @contract: Tablas categories (self-ref parentId), suppliers, products. products → categories + suppliers. Referenciada por saleItems, quoteItems, stockMovements, purchaseOrderItems.
import { pgTable, serial, varchar, text, integer, numeric, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { productAreaEnum } from './enums'

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 150 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  area: productAreaEnum('area').notNull().default('concesionaria'),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id),
  brand: varchar('brand', { length: 100 }),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  sellPrice: numeric('sell_price', { precision: 12, scale: 2 }).notNull().default('0'),
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(1),
  unit: varchar('unit', { length: 20 }).default('U'),
  photoUrl: text('photo_url'),
  photos: jsonb('photos').$type<string[]>().notNull().default([]),
  serialNumber: varchar('serial_number', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  ingresoTipo: varchar('ingreso_tipo', { length: 10 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
