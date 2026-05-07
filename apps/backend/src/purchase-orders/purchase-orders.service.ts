import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { purchaseOrders, purchaseOrderItems, products, suppliers } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { CreatePurchaseOrderDto, PurchaseOrderItemDto } from './create-purchase-order.dto'

@Injectable()
export class PurchaseOrdersService {
  private mapItems(orderId: number, items: PurchaseOrderItemDto[]) {
    return items.map(it => ({
      orderId,
      productId: it.productId ?? null,
      description: it.description,
      quantity: Number(it.quantity),
      unitPrice: it.unitPrice.toString(),
      subtotal: (Number(it.quantity) * Number(it.unitPrice)).toString(),
    }))
  }

  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 100)
    const offset = (page - 1) * limit

    const [items, countResult] = await Promise.all([
      db.select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
        userId: purchaseOrders.userId,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        total: purchaseOrders.total,
        amountFormal: purchaseOrders.amountFormal,
        amountInformal: purchaseOrders.amountInformal,
        expectedDate: purchaseOrders.expectedDate,
        receivedAt: purchaseOrders.receivedAt,
        createdAt: purchaseOrders.createdAt,
        supplierName: suppliers.name,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(purchaseOrders),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id))
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`)
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id))
    return { ...order, items }
  }

  async create(data: CreatePurchaseOrderDto, userId: number) {
    const items = data.items ?? []
    const total = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0)

    const [order] = await db.insert(purchaseOrders).values({
      supplierId: data.supplierId ?? null,
      userId,
      status: 'borrador',
      notes: data.notes ?? null,
      total: total.toString(),
      amountFormal: (data.amountFormal ?? 0).toString(),
      amountInformal: (data.amountInformal ?? 0).toString(),
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
    }).returning()

    if (items.length > 0) {
      await db.insert(purchaseOrderItems).values(this.mapItems(order.id, items))
    }

    return this.findOne(order.id)
  }

  async update(id: number, data: CreatePurchaseOrderDto) {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id))
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`)

    const items = data.items ?? []
    const total = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0)

    await db.update(purchaseOrders).set({
      supplierId: data.supplierId ?? null,
      notes: data.notes ?? null,
      total: total.toString(),
      amountFormal: (data.amountFormal ?? 0).toString(),
      amountInformal: (data.amountInformal ?? 0).toString(),
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
    }).where(eq(purchaseOrders.id, id))

    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id))
    if (items.length > 0) {
      await db.insert(purchaseOrderItems).values(this.mapItems(id, items))
    }

    return this.findOne(id)
  }

  async updateStatus(id: number, status: string) {
    const [order] = await db.update(purchaseOrders)
      .set({ status: status as 'borrador' | 'enviada' | 'recibida' | 'cancelada', receivedAt: status === 'recibida' ? new Date() : null })
      .where(eq(purchaseOrders.id, id))
      .returning()
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`)

    if (status === 'recibida') {
      const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id))
      for (const item of items) {
        if (item.productId) {
          const [prod] = await db.select().from(products).where(eq(products.id, item.productId))
          if (prod) {
            await db.update(products)
              .set({ stock: Number(prod.stock) + Number(item.quantity) })
              .where(eq(products.id, item.productId))
          }
        }
      }
    }

    return order
  }

  async remove(id: number) {
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id))
    const [order] = await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id)).returning()
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`)
    return order
  }
}
