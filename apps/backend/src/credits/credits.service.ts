import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { credits, creditPayments, creditInterestCharges, creditInstallments, clients } from '../db/schema'
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

    if (credit.creditType === 'saldo_compuesto') {
      await this.applyPendingInterest(id)
    } else {
      await this.applyInstallmentSurcharges(id)
    }

    const [client] = await db.select().from(clients).where(eq(clients.id, credit.clientId))
    const payments = await db.select().from(creditPayments).where(eq(creditPayments.creditId, id)).orderBy(asc(creditPayments.paymentDate))
    const charges = await db.select().from(creditInterestCharges).where(eq(creditInterestCharges.creditId, id)).orderBy(asc(creditInterestCharges.chargeDate))
    const installments = await db.select().from(creditInstallments).where(eq(creditInstallments.creditId, id)).orderBy(asc(creditInstallments.number))
    const balance = await this.computeBalance(id)

    return { ...credit, client, payments, charges, installments, balance }
  }

  async create(dto: CreateCreditDto & { userId: number }) {
    const creditType = dto.creditType || 'saldo_compuesto'

    if (creditType === 'cuotas_simples') {
      if (!dto.firstDueDate) throw new BadRequestException('firstDueDate requerido para cuotas_simples')
      if (!dto.installmentsCount || dto.installmentsCount < 1) throw new BadRequestException('installmentsCount requerido para cuotas_simples')
    }

    const [credit] = await db.insert(credits).values({
      clientId: dto.clientId,
      userId: dto.userId,
      creditType,
      currency: dto.currency,
      originalAmount: dto.originalAmount.toString(),
      interestRate: dto.interestRate.toString(),
      startDate: new Date(dto.startDate),
      firstDueDate: dto.firstDueDate ? new Date(dto.firstDueDate) : null,
      installmentsCount: dto.installmentsCount || null,
      notes: dto.notes,
    }).returning()

    if (creditType === 'cuotas_simples') {
      await this.generateInstallments(credit.id)
    }

    return credit
  }

  async update(id: number, dto: UpdateCreditDto) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, id))
    if (!credit) throw new NotFoundException(`Crédito ${id} no encontrado`)

    const updates: any = { updatedAt: new Date() }
    if (dto.originalAmount !== undefined) updates.originalAmount = dto.originalAmount.toString()
    if (dto.interestRate !== undefined) updates.interestRate = dto.interestRate.toString()
    if (dto.startDate) updates.startDate = new Date(dto.startDate)
    if (dto.firstDueDate) updates.firstDueDate = new Date(dto.firstDueDate)
    if (dto.installmentsCount !== undefined) updates.installmentsCount = dto.installmentsCount
    if (dto.status) updates.status = dto.status
    if (dto.notes !== undefined) updates.notes = dto.notes

    const [updated] = await db.update(credits).set(updates).where(eq(credits.id, id)).returning()

    const regenerate = credit.creditType === 'cuotas_simples' && (
      dto.originalAmount !== undefined ||
      dto.interestRate !== undefined ||
      dto.firstDueDate !== undefined ||
      dto.installmentsCount !== undefined
    )
    if (regenerate) {
      const hasPaid = await this.hasAnyPaidInstallment(id)
      if (hasPaid) throw new BadRequestException('No se puede modificar el plan: ya hay cuotas pagadas')
      await db.delete(creditInstallments).where(eq(creditInstallments.creditId, id))
      await this.generateInstallments(id)
    }

    return updated
  }

  async remove(id: number) {
    await db.delete(creditInstallments).where(eq(creditInstallments.creditId, id))
    await db.delete(creditPayments).where(eq(creditPayments.creditId, id))
    await db.delete(creditInterestCharges).where(eq(creditInterestCharges.creditId, id))
    const [deleted] = await db.delete(credits).where(eq(credits.id, id)).returning()
    if (!deleted) throw new NotFoundException(`Crédito ${id} no encontrado`)
    return deleted
  }

  async addPayment(creditId: number, dto: CreatePaymentDto, userId: number) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit) throw new NotFoundException(`Crédito ${creditId} no encontrado`)
    if (credit.status !== 'activo') throw new BadRequestException('No se pueden registrar pagos en créditos no activos')

    if (credit.creditType === 'saldo_compuesto') {
      await this.applyPendingInterest(creditId)
    }

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

  // Genera N cuotas con interés simple. amount = cuota con interés (capital + intereses) / N. principalAmount = capital / N (descuento si paga +20d antes del vto).
  async generateInstallments(creditId: number) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit || credit.creditType !== 'cuotas_simples') return
    if (!credit.firstDueDate || !credit.installmentsCount) return

    const capital = Number(credit.originalAmount)
    const rate = Number(credit.interestRate) / 100
    const n = credit.installmentsCount
    const total = capital * (1 + rate * n)
    const cuotaConInteres = total / n
    const cuotaBase = capital / n
    const firstDue = new Date(credit.firstDueDate)

    const rows = Array.from({ length: n }, (_, i) => {
      const due = new Date(firstDue)
      due.setMonth(due.getMonth() + i)
      return {
        creditId,
        number: i + 1,
        dueDate: due,
        amount: cuotaConInteres.toFixed(2),
        principalAmount: cuotaBase.toFixed(2),
        surcharge: '0',
      }
    })
    await db.insert(creditInstallments).values(rows)
  }

  // Marca cuota como pagada. Monto fijo con interés simple. Si paga post-vto suma recargo mensual acumulado.
  async payInstallment(installmentId: number, paymentDate: string, userId: number) {
    const [inst] = await db.select().from(creditInstallments).where(eq(creditInstallments.id, installmentId))
    if (!inst) throw new NotFoundException(`Cuota ${installmentId} no encontrada`)
    if (inst.paidAt) throw new BadRequestException('Cuota ya pagada')

    const [credit] = await db.select().from(credits).where(eq(credits.id, inst.creditId))
    if (!credit) throw new NotFoundException('Crédito no encontrado')

    const paid = new Date(paymentDate)
    const due = new Date(inst.dueDate)
    const baseAmount = Number(inst.amount)
    const surcharge = this.computeSurcharge(baseAmount, due, paid, Number(credit.interestRate))
    const total = baseAmount + surcharge

    await db.update(creditInstallments).set({
      paidAt: paid,
      paidAmount: total.toFixed(2),
      surcharge: surcharge.toFixed(2),
    }).where(eq(creditInstallments.id, installmentId))

    const noteParts = [`Cuota ${inst.number}/${credit.installmentsCount}`]
    if (surcharge > 0) noteParts.push(`(recargo $${surcharge.toFixed(2)})`)

    await db.insert(creditPayments).values({
      creditId: inst.creditId,
      userId,
      amount: total.toFixed(2),
      paymentDate: paid,
      notes: noteParts.join(' '),
    })

    const balance = await this.computeBalance(inst.creditId)
    if (balance <= 0) {
      await db.update(credits).set({ status: 'pagado', updatedAt: new Date() }).where(eq(credits.id, inst.creditId))
    }
    return { ok: true, surcharge, total }
  }

  async unpayInstallment(installmentId: number) {
    const [inst] = await db.select().from(creditInstallments).where(eq(creditInstallments.id, installmentId))
    if (!inst) throw new NotFoundException(`Cuota ${installmentId} no encontrada`)
    if (!inst.paidAt) throw new BadRequestException('Cuota no estaba pagada')

    // Borrar el payment generado por esta cuota
    const payments = await db.select().from(creditPayments)
      .where(and(eq(creditPayments.creditId, inst.creditId), eq(creditPayments.paymentDate, inst.paidAt)))
    for (const p of payments) {
      if (p.notes?.startsWith(`Cuota ${inst.number}/`)) {
        await db.delete(creditPayments).where(eq(creditPayments.id, p.id))
        break
      }
    }

    await db.update(creditInstallments).set({
      paidAt: null,
      paidAmount: null,
      surcharge: '0',
    }).where(eq(creditInstallments.id, installmentId))

    await db.update(credits).set({ status: 'activo', updatedAt: new Date() }).where(eq(credits.id, inst.creditId))
    return { ok: true }
  }

  // Recargo = monto * tasa * meses_vencidos. Meses redondeados hacia arriba (cualquier día post-vto cuenta).
  private computeSurcharge(amount: number, dueDate: Date, paymentDate: Date, monthlyRate: number): number {
    if (paymentDate <= dueDate) return 0
    const diffMs = paymentDate.getTime() - dueDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    const monthsLate = Math.ceil(diffDays / 30)
    return amount * (monthlyRate / 100) * monthsLate
  }

  // Refresca el campo surcharge en cuotas no pagadas con vencimiento pasado (para mostrar en UI).
  async applyInstallmentSurcharges(creditId: number) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit || credit.creditType !== 'cuotas_simples') return
    const rate = Number(credit.interestRate)
    const now = new Date()
    const insts = await db.select().from(creditInstallments).where(eq(creditInstallments.creditId, creditId))
    for (const inst of insts) {
      if (inst.paidAt) continue
      const due = new Date(inst.dueDate)
      const surcharge = this.computeSurcharge(Number(inst.amount), due, now, rate)
      if (surcharge.toFixed(2) !== Number(inst.surcharge).toFixed(2)) {
        await db.update(creditInstallments).set({ surcharge: surcharge.toFixed(2) })
          .where(eq(creditInstallments.id, inst.id))
      }
    }
  }

  private async hasAnyPaidInstallment(creditId: number): Promise<boolean> {
    const insts = await db.select().from(creditInstallments).where(eq(creditInstallments.creditId, creditId))
    return insts.some(i => !!i.paidAt)
  }

  // Aplica intereses pendientes: cada 30 días desde firstDueDate (o startDate si no hay), sobre saldo al momento del cargo.
  // Si firstDueDate está seteado, el primer interés cae exacto en firstDueDate (no 30 días después).
  async applyPendingInterest(creditId: number) {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit || credit.status !== 'activo') return
    if (credit.creditType !== 'saldo_compuesto') return

    const rate = Number(credit.interestRate) / 100
    const anchor = credit.firstDueDate ? new Date(credit.firstDueDate) : new Date(credit.startDate)
    const useAnchorAsFirst = !!credit.firstDueDate

    const charges = await db.select().from(creditInterestCharges)
      .where(eq(creditInterestCharges.creditId, creditId))
      .orderBy(desc(creditInterestCharges.chargeDate))

    const now = new Date()
    let nextChargeDate: Date

    if (charges.length > 0) {
      nextChargeDate = new Date(charges[0].chargeDate)
      nextChargeDate.setDate(nextChargeDate.getDate() + 30)
    } else if (useAnchorAsFirst) {
      nextChargeDate = new Date(anchor)
    } else {
      nextChargeDate = new Date(anchor)
      nextChargeDate.setDate(nextChargeDate.getDate() + 30)
    }

    while (true) {
      const next = nextChargeDate
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
      nextChargeDate = new Date(next)
      nextChargeDate.setDate(nextChargeDate.getDate() + 30)
    }
  }

  async computeBalance(creditId: number): Promise<number> {
    const [credit] = await db.select().from(credits).where(eq(credits.id, creditId))
    if (!credit) return 0

    if (credit.creditType === 'cuotas_simples') {
      const insts = await db.select().from(creditInstallments).where(eq(creditInstallments.creditId, creditId))
      return insts.reduce((sum, i) => {
        if (i.paidAt) return sum
        return sum + Number(i.amount) + Number(i.surcharge)
      }, 0)
    }

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
