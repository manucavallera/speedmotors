import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { stockMovements, products } from '../db/schema'
import { and, asc, desc, eq, gt, sql } from 'drizzle-orm'
import { UpdateStockMovementDto } from './stock-movement.dto'

@Injectable()
export class StockMovementsService {
  private calculateStock(previousStock: number, type: 'entrada' | 'salida' | 'ajuste', quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0)
      throw new BadRequestException('La cantidad debe ser un número entero mayor o igual a cero')
    if (type !== 'ajuste' && quantity === 0)
      throw new BadRequestException('La cantidad debe ser mayor a cero')
    if (type === 'salida' && quantity > previousStock)
      throw new BadRequestException(`Stock insuficiente: disponible ${previousStock}, solicitado ${quantity}`)

    return type === 'entrada' ? previousStock + quantity
      : type === 'salida' ? previousStock - quantity
      : quantity
  }

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

  async bulkCreate(items: { productId: number; quantity: number; reason?: string }[], userId: number) {
    const results = []
    for (const item of items) {
      const movement = await this.create(item.productId, userId, 'entrada', item.quantity, item.reason)
      results.push(movement)
    }
    return results
  }

  async create(productId: number, userId: number, type: 'entrada' | 'salida' | 'ajuste', quantity: number, reason?: string, saleId?: number) {
    const [product] = await db.select().from(products).where(eq(products.id, productId))
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`)

    const previousStock = product.stock
    const newStock = this.calculateStock(previousStock, type, quantity)

    await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, productId))

    const [movement] = await db.insert(stockMovements).values({
      productId, userId, type, quantity, previousStock, newStock,
      reason: reason || null, saleId: saleId || null,
    }).returning()

    return movement
  }

  async update(id: number, data: UpdateStockMovementDto) {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(stockMovements).where(eq(stockMovements.id, id)).for('update')
      if (!existing) throw new NotFoundException(`Movimiento ${id} no encontrado`)
      if (existing.saleId)
        throw new BadRequestException('Este movimiento pertenece a una venta. Editá o anulá la venta para corregirlo.')

      await tx.select({ id: products.id }).from(products).where(eq(products.id, existing.productId)).for('update')

      const type = data.type ?? existing.type
      const quantity = data.quantity ?? existing.quantity
      let runningStock = this.calculateStock(existing.previousStock, type, quantity)

      const [updated] = await tx.update(stockMovements).set({
        type,
        quantity,
        reason: data.reason === undefined ? existing.reason : data.reason.trim() || null,
        newStock: runningStock,
      }).where(eq(stockMovements.id, id)).returning()

      const laterMovements = await tx.select().from(stockMovements).where(and(
        eq(stockMovements.productId, existing.productId),
        gt(stockMovements.id, existing.id),
      )).orderBy(asc(stockMovements.id))

      for (const movement of laterMovements) {
        const nextStock = this.calculateStock(runningStock, movement.type, movement.quantity)
        await tx.update(stockMovements).set({ previousStock: runningStock, newStock: nextStock })
          .where(eq(stockMovements.id, movement.id))
        runningStock = nextStock
      }

      await tx.update(products).set({ stock: runningStock, updatedAt: new Date() })
        .where(eq(products.id, existing.productId))
      return updated
    })
  }

  async remove(id: number) {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(stockMovements).where(eq(stockMovements.id, id)).for('update')
      if (!existing) throw new NotFoundException(`Movimiento ${id} no encontrado`)
      if (existing.saleId)
        throw new BadRequestException('Este movimiento pertenece a una venta. Editá o anulá la venta para corregirlo.')

      await tx.select({ id: products.id }).from(products).where(eq(products.id, existing.productId)).for('update')

      const laterMovements = await tx.select().from(stockMovements).where(and(
        eq(stockMovements.productId, existing.productId),
        gt(stockMovements.id, existing.id),
      )).orderBy(asc(stockMovements.id))

      let runningStock = existing.previousStock
      for (const movement of laterMovements) {
        const nextStock = this.calculateStock(runningStock, movement.type, movement.quantity)
        await tx.update(stockMovements).set({ previousStock: runningStock, newStock: nextStock })
          .where(eq(stockMovements.id, movement.id))
        runningStock = nextStock
      }

      await tx.delete(stockMovements).where(eq(stockMovements.id, id))
      await tx.update(products).set({ stock: runningStock, updatedAt: new Date() })
        .where(eq(products.id, existing.productId))
      return existing
    })
  }
}
