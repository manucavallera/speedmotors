import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { stockMovements, products } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

@Injectable()
export class StockMovementsService {
  async findByProduct(productId: number) {
    return db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.createdAt))
  }

  async findAll() {
    return db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(200)
  }

  async create(productId: number, userId: number, type: 'entrada' | 'salida' | 'ajuste', quantity: number, reason?: string, saleId?: number) {
    const [product] = await db.select().from(products).where(eq(products.id, productId))
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`)

    const previousStock = product.stock
    const newStock = type === 'entrada' ? previousStock + quantity
      : type === 'salida' ? previousStock - quantity
      : quantity

    await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, productId))

    const [movement] = await db.insert(stockMovements).values({
      productId, userId, type, quantity, previousStock, newStock,
      reason: reason || null, saleId: saleId || null,
    }).returning()

    return movement
  }
}
