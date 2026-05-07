// @contract: Tipos puros inferidos de Drizzle. Leer esto en vez de los archivos de schema cuando solo necesitás la forma de un objeto.
import type { users } from './users.schema'
import type { clients } from './clients.schema'
import type { categories, suppliers, products } from './catalog.schema'
import type { vehicles } from './vehicles.schema'
import type { sales, saleItems, installments } from './sales.schema'
import type { quotes, quoteItems } from './quotes.schema'
import type { cashSessions, cashMovements } from './cash.schema'
import type { stockMovements } from './stock.schema'
import type { purchaseOrders, purchaseOrderItems } from './orders.schema'
import type { expenses } from './expenses.schema'

export type User             = typeof users.$inferSelect
export type NewUser          = typeof users.$inferInsert
export type Client           = typeof clients.$inferSelect
export type NewClient        = typeof clients.$inferInsert
export type Category         = typeof categories.$inferSelect
export type Supplier         = typeof suppliers.$inferSelect
export type Product          = typeof products.$inferSelect
export type NewProduct       = typeof products.$inferInsert
export type Vehicle          = typeof vehicles.$inferSelect
export type NewVehicle       = typeof vehicles.$inferInsert
export type Sale             = typeof sales.$inferSelect
export type NewSale          = typeof sales.$inferInsert
export type SaleItem         = typeof saleItems.$inferSelect
export type Installment      = typeof installments.$inferSelect
export type Quote            = typeof quotes.$inferSelect
export type QuoteItem        = typeof quoteItems.$inferSelect
export type CashSession      = typeof cashSessions.$inferSelect
export type CashMovement     = typeof cashMovements.$inferSelect
export type StockMovement    = typeof stockMovements.$inferSelect
export type PurchaseOrder    = typeof purchaseOrders.$inferSelect
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect
export type Expense          = typeof expenses.$inferSelect
export type NewExpense       = typeof expenses.$inferInsert
