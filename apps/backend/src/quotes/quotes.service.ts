import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { quotes, quoteItems } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { SalesService } from '../sales/sales.service'
import { CreateQuoteDto } from './create-quote.dto'

@Injectable()
export class QuotesService {
  constructor(private readonly salesService: SalesService) {}
  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 100)
    const offset = (page - 1) * limit

    const [items, countResult] = await Promise.all([
      db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(quotes),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id))
    if (!quote) throw new NotFoundException(`Presupuesto ${id} no encontrado`)
    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id))
    return { ...quote, items }
  }

  async create(data: CreateQuoteDto) {
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const discount = data.discount ?? 0
    const total = subtotal - discount

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 15)

    const [quote] = await db.insert(quotes).values({
      clientId: data.clientId,
      userId: data.userId,
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      total: total.toFixed(2),
      validUntil,
      notes: data.notes,
    }).returning()

    await db.insert(quoteItems).values(
      data.items.map(i => ({
        quoteId: quote.id,
        productId: i.productId ?? null,
        vehicleId: i.vehicleId ?? null,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        subtotal: (i.quantity * i.unitPrice).toFixed(2),
      }))
    )
    return this.findOne(quote.id)
  }

  async updateStatus(id: number, status: string) {
    const [quote] = await db.update(quotes).set({ status: status as any }).where(eq(quotes.id, id)).returning()
    if (!quote) throw new NotFoundException(`Presupuesto ${id} no encontrado`)
    return quote
  }

  async convertToSale(id: number, userId: number, paymentMethod: string, type: string, installmentCount: number) {
    const quote = await this.findOne(id)

    const sale = await this.salesService.create({
      clientId: quote.clientId ?? undefined,
      userId,
      type: type as 'contado' | 'cuotas',
      paymentMethod: paymentMethod as 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto',
      discount: Number(quote.discount),
      installmentCount: type === 'cuotas' ? installmentCount : undefined,
      notes: `Convertido desde presupuesto #${id}`,
      items: quote.items.map((i: any) => ({
        productId: i.productId ?? undefined,
        vehicleId: i.vehicleId ?? undefined,
        description: i.description,
        quantity: i.quantity,
        unitPrice: parseFloat(i.unitPrice),
      })),
    })

    await this.updateStatus(id, 'aceptado')
    return sale
  }

  async update(id: number, data: CreateQuoteDto) {
    await this.findOne(id)
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const discount = data.discount ?? 0
    const total = subtotal - discount

    await db.update(quotes).set({
      clientId: data.clientId ?? null,
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      total: total.toFixed(2),
      notes: data.notes ?? null,
    }).where(eq(quotes.id, id))

    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id))
    await db.insert(quoteItems).values(
      data.items.map(i => ({
        quoteId: id,
        productId: i.productId ?? null,
        vehicleId: i.vehicleId ?? null,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        subtotal: (i.quantity * i.unitPrice).toFixed(2),
      }))
    )
    return this.findOne(id)
  }

  async remove(id: number) {
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id))
    const [q] = await db.delete(quotes).where(eq(quotes.id, id)).returning()
    if (!q) throw new NotFoundException(`Presupuesto ${id} no encontrado`)
    return q
  }
}
