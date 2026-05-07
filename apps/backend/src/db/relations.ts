// @contract: Relaciones Drizzle (no DB). categoriesRelations, productsRelations, salesRelations, saleItemsRelations. Cargar solo si usás withRelations queries.
import { relations } from 'drizzle-orm'
import { categories, products, suppliers } from './catalog.schema'
import { sales, saleItems, installments } from './sales.schema'
import { clients } from './clients.schema'
import { users } from './users.schema'
import { vehicles } from './vehicles.schema'

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  supplier: one(suppliers, { fields: [products.supplierId], references: [suppliers.id] }),
  saleItems: many(saleItems),
}))

export const salesRelations = relations(sales, ({ one, many }) => ({
  client: one(clients, { fields: [sales.clientId], references: [clients.id] }),
  user: one(users, { fields: [sales.userId], references: [users.id] }),
  items: many(saleItems),
  installments: many(installments),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
  vehicle: one(vehicles, { fields: [saleItems.vehicleId], references: [vehicles.id] }),
}))
