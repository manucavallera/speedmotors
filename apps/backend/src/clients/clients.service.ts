import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db'
import { clients, sales, clientPayments, credits, creditInstallments } from '../db/schema'
import { eq, ilike, or, desc, sql } from 'drizzle-orm'
import { CreditsService } from '../credits/credits.service'

@Injectable()
export class ClientsService {
  constructor(private readonly creditsService: CreditsService) {}

  async findAll(params: { search?: string; page?: number; limit?: number; hasDebt?: boolean; type?: string } = {}) {
    const { search, hasDebt, type } = params
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 100)
    const offset = (page - 1) * limit

    // Deuda = saldo de créditos activos (cuenta corriente: capital + intereses - pagos; cuotas: cuotas impagas)
    // menos pagos a cuenta / notas de crédito, más notas de débito.
    const balanceSql = sql<number>`
      COALESCE((
        SELECT SUM(
          c.original_amount
          + COALESCE((SELECT SUM(ic.amount) FROM credit_interest_charges ic WHERE ic.credit_id = c.id), 0)
          - COALESCE((SELECT SUM(cp2.amount) FROM credit_payments cp2 WHERE cp2.credit_id = c.id), 0)
        )
        FROM credits c
        WHERE c.client_id = clients.id AND c.status = 'activo' AND c.credit_type <> 'cuotas_simples'
      ), 0)
      + COALESCE((
        SELECT SUM(ci.amount + ci.surcharge) FROM credit_installments ci
        JOIN credits c ON ci.credit_id = c.id
        WHERE c.client_id = clients.id AND c.status = 'activo' AND ci.paid_at IS NULL
      ), 0)
      - COALESCE((
        SELECT SUM(cp.amount) FROM client_payments cp
        WHERE cp.client_id = clients.id AND cp.type IN ('pago_cuenta', 'nota_credito')
      ), 0)
      + COALESCE((
        SELECT SUM(cp.amount) FROM client_payments cp
        WHERE cp.client_id = clients.id AND cp.type = 'nota_debito'
      ), 0)
    `

    const searchWhere = search
      ? or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.phone, `%${search}%`),
          ilike(clients.dni, `%${search}%`),
        )
      : undefined

    const debtWhere = hasDebt
      ? sql`(${balanceSql}) > 0`
      : undefined

    const typeWhere = type ? eq(clients.type, type as 'concesionaria' | 'guarderia') : undefined

    const parts = [searchWhere, debtWhere, typeWhere].filter(Boolean)
    const where = parts.length
      ? sql`${sql.join(parts.map((p) => sql`(${p})`), sql` AND `)}`
      : undefined

    const selectFields = {
      id: clients.id,
      type: clients.type,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      dni: clients.dni,
      cuit: clients.cuit,
      condicionIva: clients.condicionIva,
      address: clients.address,
      notes: clients.notes,
      createdAt: clients.createdAt,
      balance: balanceSql,
    }

    const [items, countResult] = await Promise.all([
      where
        ? db.select(selectFields).from(clients).where(where).orderBy(desc(clients.createdAt)).limit(limit).offset(offset)
        : db.select(selectFields).from(clients).orderBy(desc(clients.createdAt)).limit(limit).offset(offset),
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

    // Deuda real vive en créditos (cuenta corriente + financiado), no en la tabla installments legacy.
    const clientCredits = await db.select().from(credits).where(eq(credits.clientId, id))
    const now = new Date()

    let totalPending = 0
    let totalOverdue = 0
    const pendingInstallments: any[] = []
    const overdueInstallments: any[] = []
    const accountCredits: any[] = []
    const saleStatus = new Map<number, { installmentCount: number; pendingCount: number; paidCount: number }>()

    for (const credit of clientCredits) {
      if (credit.status !== 'activo') continue
      // saldo_compuesto: materializa intereses pendientes antes de leer el saldo (rate 0 = no-op)
      await this.creditsService.applyPendingInterest(credit.id)
      const creditBalance = await this.creditsService.computeBalance(credit.id)

      if (credit.creditType === 'cuotas_simples') {
        const insts = await db.select().from(creditInstallments)
          .where(eq(creditInstallments.creditId, credit.id))
          .orderBy(creditInstallments.dueDate)
        const pend = insts.filter(i => !i.paidAt)
        if (credit.saleId) saleStatus.set(credit.saleId, { installmentCount: insts.length, pendingCount: pend.length, paidCount: insts.length - pend.length })
        for (const i of pend) {
          const row = { id: i.id, creditId: credit.id, saleId: credit.saleId, number: i.number, amount: i.amount, dueDate: i.dueDate, status: 'pendiente', clientName: client.name }
          pendingInstallments.push(row)
          if (new Date(i.dueDate) < now) { overdueInstallments.push(row); totalOverdue += Number(i.amount) }
        }
      } else if (creditBalance > 0) {
        // cuenta corriente / saldo variable: deuda como saldo (sin cuotas). Vencida si pasó firstDueDate.
        const overdue = !!credit.firstDueDate && new Date(credit.firstDueDate) < now
        accountCredits.push({
          id: credit.id,
          saleId: credit.saleId,
          creditType: credit.creditType,
          interestRate: Number(credit.interestRate),
          balance: creditBalance,
          dueDate: credit.firstDueDate,
          overdue,
        })
        if (overdue) totalOverdue += creditBalance
      }
      if (creditBalance > 0) totalPending += creditBalance
    }

    // Pagos a cuenta y notas reducen saldo; notas débito lo aumentan
    const totalAccountPayments = payments
      .filter(p => p.type === 'pago_cuenta' || p.type === 'nota_credito')
      .reduce((s, p) => s + Number(p.amount), 0)
    const totalDebitNotes = payments
      .filter(p => p.type === 'nota_debito')
      .reduce((s, p) => s + Number(p.amount), 0)
    const balance = totalPending - totalAccountPayments + totalDebitNotes

    const salesWithStatus = clientSales.map(s => {
      const st = saleStatus.get(s.id) ?? { installmentCount: 0, pendingCount: 0, paidCount: 0 }
      return { ...s, ...st }
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
      accountCredits,
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

  async parseComprobante(file: Express.Multer.File): Promise<{ amount: string; date: string; description: string }> {
    if (!process.env.ANTHROPIC_API_KEY) throw new BadRequestException('ANTHROPIC_API_KEY no configurada')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const base64 = file.buffer.toString('base64')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: base64 } },
          { type: 'text', text: 'Extraé los datos de este comprobante de pago o transferencia bancaria argentina. Devolvé SOLO un JSON sin texto adicional:\n{"amount":"monto en números sin símbolos ni puntos de miles, solo decimales con punto, o cadena vacía","date":"fecha en formato YYYY-MM-DD o cadena vacía","description":"descripción breve del pago o transferencia"}' },
        ],
      }],
    })

    const raw = (response.content[0] as Anthropic.TextBlock).text
    const text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    try {
      return JSON.parse(text)
    } catch {
      throw new BadRequestException('No se pudo leer el comprobante')
    }
  }

  async parseDni(file: Express.Multer.File): Promise<{ name: string; dni: string; address: string }> {
    if (!process.env.ANTHROPIC_API_KEY) throw new BadRequestException('ANTHROPIC_API_KEY no configurada')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const base64 = file.buffer.toString('base64')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: base64 } },
          { type: 'text', text: 'Extraé los datos de este DNI argentino. Devolvé SOLO un JSON sin texto adicional:\n{"name":"apellido y nombre completo","dni":"número de DNI sin puntos","address":"domicilio completo o cadena vacía"}' },
        ],
      }],
    })

    const raw = (response.content[0] as Anthropic.TextBlock).text
    const text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    try {
      return JSON.parse(text)
    } catch {
      throw new BadRequestException('No se pudo leer el DNI')
    }
  }
}
