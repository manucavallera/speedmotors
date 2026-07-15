import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { cashSessions, cashMovements, sales, expenses } from '../db/schema'
import { eq, and, desc, gte, sql } from 'drizzle-orm'

// Cada caja es un área independiente: la de SpeedMotors y la de la marina
export type CashArea = 'speedmotors' | 'marina'

@Injectable()
export class CashService {
  async getOpenSession(area: CashArea = 'speedmotors') {
    const [session] = await db.select().from(cashSessions)
      .where(and(eq(cashSessions.status, 'abierta'), eq(cashSessions.area, area))).limit(1)
    return session || null
  }

  async findAll(area?: CashArea) {
    const base = db.select().from(cashSessions)
    const q = area ? base.where(eq(cashSessions.area, area)) : base
    return q.orderBy(desc(cashSessions.openedAt))
  }

  async openSession(userId: number, openingBalance: number, area: CashArea = 'speedmotors') {
    const existing = await this.getOpenSession(area)
    if (existing) throw new BadRequestException('Ya hay una caja abierta')
    const [session] = await db.insert(cashSessions).values({ userId, openingBalance: openingBalance.toString(), area }).returning()
    return session
  }

  async closeSession(userId: number, area: CashArea = 'speedmotors', notes?: string, countedBalance?: number) {
    const session = await this.getOpenSession(area)
    if (!session) throw new BadRequestException('No hay caja abierta')

    // Solo la caja de SpeedMotors cuenta ventas/gastos. La marina cobra todo por movimientos (depósitos).
    // Caja solo cuenta efectivo recibido: contado completo, cuotas solo la seña, cuenta_corriente nada
    const salesData = area === 'speedmotors' ? await db.select({ total: sql<string>`coalesce(sum(case when ${sales.type}='contado' then ${sales.total} when ${sales.type}='cuotas' then ${sales.downPayment} else 0 end),0)` })
      .from(sales).where(gte(sales.createdAt, session.openedAt)) : [{ total: '0' }]

    const expensesData = area === 'speedmotors' ? await db.select({ total: sql<string>`coalesce(sum(${expenses.amount}),0)` })
      .from(expenses).where(gte(expenses.createdAt, session.openedAt)) : [{ total: '0' }]

    const movementsData = await db.select({
      depositos: sql<string>`coalesce(sum(case when ${cashMovements.type}='deposito' then ${cashMovements.amount} else 0 end),0)`,
      retiros: sql<string>`coalesce(sum(case when ${cashMovements.type}='retiro' then ${cashMovements.amount} else 0 end),0)`,
    }).from(cashMovements).where(eq(cashMovements.sessionId, session.id))

    const salesAmt = parseFloat(salesData[0]?.total || '0')
    const expensesAmt = parseFloat(expensesData[0]?.total || '0')
    const depositos = parseFloat(movementsData[0]?.depositos || '0')
    const retiros = parseFloat(movementsData[0]?.retiros || '0')
    const expectedBalance = Number(session.openingBalance) + salesAmt - expensesAmt + depositos - retiros

    const difference = countedBalance !== undefined ? countedBalance - expectedBalance : null

    const [closed] = await db.update(cashSessions).set({
      status: 'cerrada',
      closedAt: new Date(),
      expectedBalance: expectedBalance.toFixed(2),
      countedBalance: countedBalance !== undefined ? countedBalance.toFixed(2) : null,
      difference: difference !== null ? difference.toFixed(2) : null,
      notes,
    }).where(eq(cashSessions.id, session.id)).returning()

    return closed
  }

  async createMovement(sessionId: number, userId: number, type: 'retiro' | 'deposito', amount: number, reason?: string) {
    const [session] = await db.select().from(cashSessions).where(eq(cashSessions.id, sessionId))
    if (!session || session.status !== 'abierta') throw new BadRequestException('La caja no está abierta')
    const [movement] = await db.insert(cashMovements).values({
      sessionId,
      userId,
      type,
      amount: amount.toString(),
      reason,
    }).returning()
    return movement
  }

  async removeSession(id: number) {
    const [session] = await db.select().from(cashSessions).where(eq(cashSessions.id, id))
    if (!session) throw new NotFoundException(`Sesión ${id} no encontrada`)
    if (session.status === 'abierta') throw new BadRequestException('No se puede eliminar una sesión abierta')
    return db.transaction(async (tx) => {
      await tx.delete(cashMovements).where(eq(cashMovements.sessionId, id))
      const [deleted] = await tx.delete(cashSessions).where(eq(cashSessions.id, id)).returning()
      return deleted
    })
  }

  async getMovements(sessionId: number) {
    return db.select().from(cashMovements)
      .where(eq(cashMovements.sessionId, sessionId))
      .orderBy(desc(cashMovements.createdAt))
  }

  async getSessionSummary(area: CashArea = 'speedmotors') {
    const session = await this.getOpenSession(area)
    if (!session) return null

    // Solo SpeedMotors suma ventas/gastos. La marina cobra todo por movimientos (depósitos).
    // Caja solo cuenta efectivo recibido: contado completo, cuotas solo la seña, cuenta_corriente nada
    const salesData = area === 'speedmotors' ? await db.select({ total: sql<string>`coalesce(sum(case when ${sales.type}='contado' then ${sales.total} when ${sales.type}='cuotas' then ${sales.downPayment} else 0 end),0)`, count: sql<string>`count(*)` })
      .from(sales).where(gte(sales.createdAt, session.openedAt)) : [{ total: '0', count: '0' }]

    const expensesData = area === 'speedmotors' ? await db.select({ total: sql<string>`coalesce(sum(${expenses.amount}),0)`, count: sql<string>`count(*)` })
      .from(expenses).where(gte(expenses.createdAt, session.openedAt)) : [{ total: '0', count: '0' }]

    const movementsData = await db.select({
      depositos: sql<string>`coalesce(sum(case when ${cashMovements.type}='deposito' then ${cashMovements.amount} else 0 end),0)`,
      retiros: sql<string>`coalesce(sum(case when ${cashMovements.type}='retiro' then ${cashMovements.amount} else 0 end),0)`,
      count: sql<string>`count(*)`,
    }).from(cashMovements).where(eq(cashMovements.sessionId, session.id))

    const salesTotal = parseFloat(salesData[0]?.total || '0')
    const expensesTotal = parseFloat(expensesData[0]?.total || '0')
    const depositos = parseFloat(movementsData[0]?.depositos || '0')
    const retiros = parseFloat(movementsData[0]?.retiros || '0')

    const movements = await this.getMovements(session.id)

    // Desglose de depósitos por rubro (según prefijo del motivo). Sirve para el cierre diario.
    const rubroDe = (reason: string | null) => {
      if (!reason) return 'Otros'
      if (reason.startsWith('Guardería')) return 'Guardería'
      if (reason.startsWith('Salida al agua') || reason.startsWith('Botadura')) return 'Turnera'
      if (reason.startsWith('Proveeduría')) return 'Proveeduría'
      return 'Otros'
    }
    const rubroMap = new Map<string, number>()
    for (const m of movements) {
      if (m.type !== 'deposito') continue
      const k = rubroDe(m.reason)
      rubroMap.set(k, (rubroMap.get(k) ?? 0) + Number(m.amount))
    }
    const depositsByRubro = [...rubroMap.entries()].map(([rubro, total]) => ({ rubro, total }))

    return {
      session,
      salesTotal,
      salesCount: parseInt(salesData[0]?.count || '0'),
      expensesTotal,
      expensesCount: parseInt(expensesData[0]?.count || '0'),
      depositos,
      retiros,
      depositsByRubro,
      movements,
      currentBalance: Number(session.openingBalance) + salesTotal - expensesTotal + depositos - retiros,
    }
  }
}
