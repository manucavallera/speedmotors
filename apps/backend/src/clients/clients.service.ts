import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { clients, sales, installments, saleItems, clientPayments } from '../db/schema'
import { eq, ilike, or, inArray, desc, sql } from 'drizzle-orm'

@Injectable()
export class ClientsService {
  async findAll(params: { search?: string; page?: number; limit?: number } = {}) {
    const { search } = params
    const page = params.page ?? 1
    const limit = params.limit ?? 100
    const offset = (page - 1) * limit

    const where = search
      ? or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.phone, `%${search}%`),
          ilike(clients.dni, `%${search}%`),
        )
      : undefined

    const [items, countResult] = await Promise.all([
      where
        ? db.select().from(clients).where(where).limit(limit).offset(offset)
        : db.select().from(clients).limit(limit).offset(offset),
      where
        ? db.select({ count: sql<number>`count(*)::int` }).from(clients).where(where)
        : db.select({ count: sql<number>`count(*)::int` }).from(clients),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id))
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`)
    return client
  }

  async findSales(id: number) {
    await this.findOne(id)
    return db.select().from(sales).where(eq(sales.clientId, id))
  }

  async getAccount(id: number) {
    const client = await this.findOne(id)
    const clientSales = await db.select().from(sales)
      .where(eq(sales.clientId, id))
      .orderBy(desc(sales.createdAt))

    const totalPurchased = clientSales.reduce((sum, s) => sum + Number(s.total), 0)

    const payments = await db.select().from(clientPayments)
      .where(eq(clientPayments.clientId, id))
      .orderBy(desc(clientPayments.date))

    if (clientSales.length === 0) {
      const totalCredits = payments.filter(p => p.type !== 'nota_debito').reduce((s, p) => s + Number(p.amount), 0)
      const totalDebits = payments.filter(p => p.type === 'nota_debito').reduce((s, p) => s + Number(p.amount), 0)
      return { client, totalPurchased: 0, totalPending: 0, totalOverdue: 0, balance: totalDebits - totalCredits, pendingInstallments: [], overdueInstallments: [], sales: [], payments }
    }

    const saleIds = clientSales.map(s => s.id)
    const allInstallments = await db.select().from(installments)
      .where(inArray(installments.saleId, saleIds))
      .orderBy(installments.dueDate)

    const now = new Date()
    const pendingInstallments = allInstallments.filter(i => i.status === 'pendiente')
    const overdueInstallments = pendingInstallments.filter(i => new Date(i.dueDate) < now)

    const totalPending = pendingInstallments.reduce((sum, i) => sum + Number(i.amount), 0)
    const totalOverdue = overdueInstallments.reduce((sum, i) => sum + Number(i.amount), 0)

    // Pagos a cuenta y notas reducen saldo; notas débito lo aumentan
    const totalAccountPayments = payments
      .filter(p => p.type === 'pago_cuenta' || p.type === 'nota_credito')
      .reduce((s, p) => s + Number(p.amount), 0)
    const totalDebitNotes = payments
      .filter(p => p.type === 'nota_debito')
      .reduce((s, p) => s + Number(p.amount), 0)
    const balance = totalPending - totalAccountPayments + totalDebitNotes

    const salesWithStatus = clientSales.map(s => {
      const saleInst = allInstallments.filter(i => i.saleId === s.id)
      const pendingCount = saleInst.filter(i => i.status === 'pendiente').length
      const paidCount = saleInst.filter(i => i.status === 'pagado').length
      return { ...s, installmentCount: saleInst.length, pendingCount, paidCount }
    })

    return {
      client,
      totalPurchased,
      totalPending,
      totalOverdue,
      balance,
      totalAccountPayments,
      pendingInstallments,
      overdueInstallments,
      sales: salesWithStatus,
      payments,
    }
  }

  async addPayment(clientId: number, userId: number, data: { type: 'pago_cuenta' | 'nota_credito' | 'nota_debito'; amount: number; description: string; date?: string; notes?: string }) {
    const [p] = await db.insert(clientPayments).values({
      clientId,
      userId,
      type: data.type,
      amount: data.amount.toFixed(2),
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description,
      notes: data.notes ?? null,
    }).returning()
    return p
  }

  async removePayment(paymentId: number) {
    await db.delete(clientPayments).where(eq(clientPayments.id, paymentId))
    return { ok: true }
  }

  async create(data: typeof clients.$inferInsert) {
    const [client] = await db.insert(clients).values(data).returning()
    return client
  }

  async update(id: number, data: Partial<typeof clients.$inferInsert>) {
    const [client] = await db.update(clients).set(data).where(eq(clients.id, id)).returning()
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`)
    return client
  }

  async remove(id: number) {
    const [client] = await db.delete(clients).where(eq(clients.id, id)).returning()
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`)
    return client
  }
}
