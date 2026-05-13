import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { stockMovements, products } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'

@Injectable()
export class StockMovementsService {
  async findByProduct(productId: number) {
    return db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.createdAt))
  }

  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 50)
    const offset = (page - 1) * limit
    const [items, countResult] = await Promise.all([
      db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(stockMovements),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async create(productId: number, userId: number, type: 'entrada' | 'salida' | 'ajuste', quantity: number, reason?: string, saleId?: number) {
    const [product] = await db.select().from(products).where(eq(products.id, productId))
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`)

    const previousStock = product.stock
    if (type === 'salida' && quantity > previousStock)
      throw new BadRequestException(`Stock insuficiente: disponible ${previousStock}, solicitado ${quantity}`)
    if (type === 'ajuste' && quantity < 0)
      throw new BadRequestException('El ajuste no puede resultar en stock negativo')
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
