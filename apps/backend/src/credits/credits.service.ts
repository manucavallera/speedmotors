import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { credits, creditPayments, creditInterestCharges, clients } from '../db/schema'
import { eq, desc, asc, and } from 'drizzle-orm'
import { CreateCreditDto, UpdateCreditDto, CreatePaymentDto } from './credit.dto'

@Injectable()
export class CreditsService {
  async findAll(status?: string) {
    const rows = await db.select({
      credit: credits,
      client: clients,
    }).from(credits)
      .leftJoin(clients, eq(credits.clientId, clients.id))
      .where(status ? eq(credits.status, status as any) : undefined)
      .orderBy(desc(credits.createdAt))

    return Promise.all(rows.map(async r => {
      const balance = await this.computeBalance(r.credit.id)
      return { ...r.credit, client: r.client, balance }
    }))
  }

  async findOne(id: number) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, id))
    if (!credit) throw new NotFoundException(`Crédito ${id} no encontrado`)

    await this.applyPendingInterest(id)

    const [client] = await db.select().from(clients).where(eq(clients.id, credit.clientId))
    const payments = await db.select().from(creditPayments).where(eq(creditPayments.creditId, id)).orderBy(asc(creditPayments.paymentDate))
    const charges = await db.select().from(creditInterestCharges).where(eq(creditInterestCharges.creditId, id)).orderBy(asc(creditInterestCharges.chargeDate))
    const balance = await this.computeBalance(id)

    return { ...credit, client, payments, charges, balance }
  }

  async create(dto: CreateCreditDto & { userId: number }) {
    const [credit] = await db.insert(credits).values({
      clientId: dto.clientId,
      userId: dto.userId,
      currency: dto.currency,
      originalAmount: dto.originalAmount.toString(),
      interestRate: dto.interestRate.toString(),
      startDate: new Date(dto.startDate),
      notes: dto.notes,
    }).returning()
    return credit
  }

  async update(id: number, dto: UpdateCreditDto) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, id))
    if (!credit) throw new NotFoundException(`Crédito ${id} no encontrado`)

    const updates: any = { updatedAt: new Date() }
    if (dto.originalAmount !== undefined) updates.originalAmount = dto.originalAmount.toString()
    if (dto.interestRate !== undefined) updates.interestRate = dto.interestRate.toString()
    if (dto.startDate) updates.startDate = new Date(dto.startDate)
    if (dto.status) updates.status = dto.status
    if (dto.notes !== undefined) updates.notes = dto.notes

    const [updated] = await db.update(credits).set(updates).where(eq(credits.id, id)).returning()
    return updated
  }

  async remove(id: number) {
    const [deleted] = await db.delete(credits).where(eq(credits.id, id)).returning()
    if (!deleted) throw new NotFoundException(`Crédito ${id} no encontrado`)
    return deleted
  }

  async addPayment(creditId: number, dto: CreatePaymentDto, userId: number) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit) throw new NotFoundException(`Crédito ${creditId} no encontrado`)
    if (credit.status !== 'activo') throw new BadRequestException('No se pueden registrar pagos en créditos no activos')

    await this.applyPendingInterest(creditId)

    const [payment] = await db.insert(creditPayments).values({
      creditId,
      userId,
      amount: dto.amount.toString(),
      paymentDate: new Date(dto.paymentDate),
      notes: dto.notes,
    }).returning()

    const balance = await this.computeBalance(creditId)
    if (balance <= 0) {
      await db.update(credits).set({ status: 'pagado', updatedAt: new Date() }).where(eq(credits.id, creditId))
    }
    return payment
  }

  async removePayment(paymentId: number) {
    const [payment] = await db.select().from(creditPayments).where(eq(creditPayments.id, paymentId))
    if (!payment) throw new NotFoundException(`Pago ${paymentId} no encontrado`)
    await db.delete(creditPayments).where(eq(creditPayments.id, paymentId))

    const balance = await this.computeBalance(payment.creditId)
    if (balance > 0) {
      await db.update(credits).set({ status: 'activo', updatedAt: new Date() }).where(eq(credits.id, payment.creditId))
    }
    return { ok: true }
  }

  // Aplica intereses pendientes: cada 30 días desde startDate (o último cargo), sobre saldo al momento del cargo.
  async applyPendingInterest(creditId: number) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit || credit.status !== 'activo') return

    const rate = Number(credit.interestRate) / 100
    const startDate = new Date(credit.startDate)

    const charges = await db.select().from(creditInterestCharges)
      .where(eq(creditInterestCharges.creditId, creditId))
      .orderBy(desc(creditInterestCharges.chargeDate))

    let lastChargeDate = charges.length > 0 ? new Date(charges[0].chargeDate) : startDate
    const now = new Date()

    // Aplicar un cargo por cada 30 días transcurridos
    while (true) {
      const next = new Date(lastChargeDate)
      next.setDate(next.getDate() + 30)
      if (next > now) break

      const balanceBefore = await this.computeBalanceAt(creditId, next)
      if (balanceBefore <= 0) break

      const interestAmount = balanceBefore * rate
      await db.insert(creditInterestCharges).values({
        creditId,
        chargeDate: next,
        balanceBefore: balanceBefore.toFixed(2),
        amount: interestAmount.toFixed(2),
      })
      lastChargeDate = next
    }
  }

  async computeBalance(creditId: number): Promise<number> {
    return this.computeBalanceAt(creditId, new Date(8640000000000000))
  }

  private async computeBalanceAt(creditId: number, atDate: Date): Promise<number> {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit) return 0

    const payments = await db.select().from(creditPayments)
      .where(and(eq(creditPayments.creditId, creditId)))
    const charges = await db.select().from(creditInterestCharges)
      .where(and(eq(creditInterestCharges.creditId, creditId)))

    const paymentsTotal = payments
      .filter(p => new Date(p.paymentDate) <= atDate)
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const chargesTotal = charges
      .filter(c => new Date(c.chargeDate) < atDate)
      .reduce((sum, c) => sum + Number(c.amount), 0)

    return Number(credit.originalAmount) + chargesTotal - paymentsTotal
  }
}
