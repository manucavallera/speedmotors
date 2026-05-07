import { Injectable } from '@nestjs/common'
import { db } from '../db'
import { sales, saleItems, expenses, installments, products, clients, users } from '../db/schema'
import { sql, and, gte, lte, eq, lt, desc } from 'drizzle-orm'

@Injectable()
export class ReportsService {
  async getSummary(from: Date, to: Date) {
    const toEndOfDay = new Date(to)
    toEndOfDay.setHours(23, 59, 59, 999)

    const [salesResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
        count: sql<string>`COUNT(*)`,
        totalFormal: sql<string>`COALESCE(SUM(${sales.amountFormal}), 0)`,
        totalInformal: sql<string>`COALESCE(SUM(${sales.amountInformal}), 0)`,
      })
      .from(sales)
      .where(and(gte(sales.createdAt, from), lte(sales.createdAt, toEndOfDay)))

    const [expensesResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(gte(expenses.date, from), lte(expenses.date, toEndOfDay)))

    const byMethod = await db
      .select({
        method: sales.paymentMethod,
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(sales)
      .where(and(gte(sales.createdAt, from), lte(sales.createdAt, toEndOfDay)))
      .groupBy(sales.paymentMethod)

    const expensesByCategory = await db
      .select({
        category: expenses.category,
        total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(gte(expenses.date, from), lte(expenses.date, toEndOfDay)))
      .groupBy(expenses.category)

    const salesTotal = Number(salesResult.total)
    const expensesTotal = Number(expensesResult.total)

    return {
      period: { from, to: toEndOfDay },
      sales: { total: salesTotal, count: Number(salesResult.count), totalFormal: Number(salesResult.totalFormal), totalInformal: Number(salesResult.totalInformal) },
      expenses: { total: expensesTotal, count: Number(expensesResult.count) },
      profit: salesTotal - expensesTotal,
      margin: salesTotal > 0 ? ((salesTotal - expensesTotal) / salesTotal) * 100 : 0,
      byPaymentMethod: byMethod.map(m => ({
        method: m.method,
        total: Number(m.total),
        count: Number(m.count),
      })),
      expensesByCategory: expensesByCategory.map(e => ({
        category: e.category,
        total: Number(e.total),
        count: Number(e.count),
      })),
    }
  }

  async getFullReport(from: Date, to: Date) {
    const toEndOfDay = new Date(to)
    toEndOfDay.setHours(23, 59, 59, 999)

    // Período anterior del mismo largo
    const periodMs = toEndOfDay.getTime() - from.getTime()
    const prevTo = new Date(from.getTime() - 1)
    const prevFrom = new Date(prevTo.getTime() - periodMs)

    const [current, previous] = await Promise.all([
      this.getSummary(from, toEndOfDay),
      this.getSummary(prevFrom, prevTo),
    ])

    const topClients = await db
      .select({
        clientId: sales.clientId,
        clientName: clients.name,
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(sales)
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .where(and(gte(sales.createdAt, from), lte(sales.createdAt, toEndOfDay), sql`${sales.clientId} IS NOT NULL`))
      .groupBy(sales.clientId, clients.name)
      .orderBy(desc(sql`SUM(${sales.total})`))
      .limit(5)

    const topProducts = await db
      .select({
        productId: saleItems.productId,
        productName: products.name,
        quantity: sql<string>`COALESCE(SUM(${saleItems.quantity}), 0)`,
        total: sql<string>`COALESCE(SUM(${saleItems.subtotal}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(and(gte(sales.createdAt, from), lte(sales.createdAt, toEndOfDay), sql`${saleItems.productId} IS NOT NULL`))
      .groupBy(saleItems.productId, products.name)
      .orderBy(desc(sql`SUM(${saleItems.quantity})`))
      .limit(5)

    // Evolución últimos 6 meses — 2 queries GROUP BY en lugar de loop secuencial
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [monthlySalesRaw, monthlyExpensesRaw] = await Promise.all([
      db.select({
        year: sql<number>`EXTRACT(YEAR FROM ${sales.createdAt})::int`,
        month: sql<number>`EXTRACT(MONTH FROM ${sales.createdAt})::int`,
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
      })
        .from(sales)
        .where(gte(sales.createdAt, sixMonthsAgo))
        .groupBy(sql`EXTRACT(YEAR FROM ${sales.createdAt}), EXTRACT(MONTH FROM ${sales.createdAt})`),
      db.select({
        year: sql<number>`EXTRACT(YEAR FROM ${expenses.date})::int`,
        month: sql<number>`EXTRACT(MONTH FROM ${expenses.date})::int`,
        total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
        .from(expenses)
        .where(gte(expenses.date, sixMonthsAgo))
        .groupBy(sql`EXTRACT(YEAR FROM ${expenses.date}), EXTRACT(MONTH FROM ${expenses.date})`),
    ])

    const monthlyEvolution = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const s = monthlySalesRaw.find(r => r.year === y && r.month === m)
      const e = monthlyExpensesRaw.find(r => r.year === y && r.month === m)
      const salesT = s ? Number(s.total) : 0
      const expT = e ? Number(e.total) : 0
      return {
        month: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
        sales: salesT,
        expenses: expT,
        profit: salesT - expT,
      }
    })

    // Cuotas: cobradas vs pendientes del período
    const [paidInst] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${installments.amount}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(installments)
      .where(and(eq(installments.status, 'pagado'), gte(installments.paidAt, from), lte(installments.paidAt, toEndOfDay)))

    const [pendingInst] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${installments.amount}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(installments)
      .where(eq(installments.status, 'pendiente'))

    const [overdueInst] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${installments.amount}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(installments)
      .where(and(eq(installments.status, 'pendiente'), lt(installments.dueDate, new Date())))

    return {
      current,
      previous,
      changes: {
        sales: this.pctChange(current.sales.total, previous.sales.total),
        expenses: this.pctChange(current.expenses.total, previous.expenses.total),
        profit: this.pctChange(current.profit, previous.profit),
        salesCount: this.pctChange(current.sales.count, previous.sales.count),
      },
      topClients: topClients.map(c => ({
        clientId: c.clientId,
        name: c.clientName || 'Sin cliente',
        total: Number(c.total),
        count: Number(c.count),
      })),
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        name: p.productName || `Producto #${p.productId}`,
        quantity: Number(p.quantity),
        total: Number(p.total),
      })),
      monthlyEvolution,
      installments: {
        paid: { total: Number(paidInst.total), count: Number(paidInst.count) },
        pending: { total: Number(pendingInst.total), count: Number(pendingInst.count) },
        overdue: { total: Number(overdueInst.total), count: Number(overdueInst.count) },
      },
    }
  }

  private pctChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / Math.abs(previous)) * 100
  }

  async getDashboard() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [thisMonth, lastMonth] = await Promise.all([
      this.getSummary(startOfMonth, now),
      this.getSummary(startOfLastMonth, endOfLastMonth),
    ])

    const [overdueResult] = await db
      .select({
        count: sql<string>`COUNT(*)`,
        total: sql<string>`COALESCE(SUM(${installments.amount}), 0)`,
      })
      .from(installments)
      .where(and(eq(installments.status, 'pendiente'), lt(installments.dueDate, now)))

    const [lowStockResult] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(products)
      .where(sql`${products.stock} <= ${products.minStock} AND ${products.stock} > 0 AND ${products.active} = true`)

    const bySeller = await db
      .select({
        userId: sales.userId,
        userName: users.name,
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(sales)
      .leftJoin(users, eq(sales.userId, users.id))
      .where(and(gte(sales.createdAt, startOfMonth), lte(sales.createdAt, now)))
      .groupBy(sales.userId, users.name)
      .orderBy(desc(sql`SUM(${sales.total})`))

    return {
      thisMonth,
      lastMonth,
      overdueInstallments: {
        count: Number(overdueResult.count),
        total: Number(overdueResult.total),
      },
      lowStockCount: Number(lowStockResult.count),
      bySeller: bySeller.map(s => ({
        userId: s.userId,
        name: s.userName ?? 'Sin asignar',
        total: Number(s.total),
        count: Number(s.count),
      })),
    }
  }
}
