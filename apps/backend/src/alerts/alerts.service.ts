import { Injectable } from '@nestjs/common'
import { db } from '../db'
import { installments, sales, clients, reservations, purchaseOrders, reminders, suppliers, creditInstallments, credits } from '../db/schema'
import { eq, lt, lte, and, gte, desc, inArray, isNull, isNotNull } from 'drizzle-orm'

@Injectable()
export class AlertsService {
  async getAlerts() {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    const ago30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [overdueInstallments, upcomingInstallments, activeReservations, pendingOrders, allReminders, overdueCreditInsts, upcomingCreditInsts, overdueCreditsCC, upcomingCreditsCC] =
      await Promise.all([
        db
          .select({
            id: installments.id,
            saleId: installments.saleId,
            number: installments.number,
            amount: installments.amount,
            dueDate: installments.dueDate,
            clientName: clients.name,
            saleNumber: sales.saleNumber,
          })
          .from(installments)
          .leftJoin(sales, eq(installments.saleId, sales.id))
          .leftJoin(clients, eq(sales.clientId, clients.id))
          .where(and(eq(installments.status, 'pendiente'), lt(installments.dueDate, now)))
          .orderBy(installments.dueDate)
          .limit(50),

        db
          .select({
            id: installments.id,
            saleId: installments.saleId,
            number: installments.number,
            amount: installments.amount,
            dueDate: installments.dueDate,
            clientName: clients.name,
            saleNumber: sales.saleNumber,
          })
          .from(installments)
          .leftJoin(sales, eq(installments.saleId, sales.id))
          .leftJoin(clients, eq(sales.clientId, clients.id))
          .where(and(eq(installments.status, 'pendiente'), gte(installments.dueDate, now), lte(installments.dueDate, in7Days)))
          .orderBy(installments.dueDate)
          .limit(50),

        db
          .select({
            id: reservations.id,
            reservationNumber: reservations.reservationNumber,
            clientName: reservations.clientName,
            brand: reservations.brand,
            model: reservations.model,
            depositAmount: reservations.depositAmount,
            createdAt: reservations.createdAt,
          })
          .from(reservations)
          .where(and(eq(reservations.status, 'vigente'), lte(reservations.createdAt, ago30Days)))
          .orderBy(reservations.createdAt)
          .limit(20),

        db
          .select({
            id: purchaseOrders.id,
            supplierName: suppliers.name,
            total: purchaseOrders.total,
            status: purchaseOrders.status,
            createdAt: purchaseOrders.createdAt,
          })
          .from(purchaseOrders)
          .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
          .where(inArray(purchaseOrders.status, ['borrador', 'enviada']))
          .orderBy(desc(purchaseOrders.createdAt))
          .limit(20),

        db
          .select()
          .from(reminders)
          .where(inArray(reminders.status, ['pendiente', 'vencido']))
          .orderBy(reminders.dueDate),

        db
          .select({
            id: creditInstallments.id,
            creditId: creditInstallments.creditId,
            number: creditInstallments.number,
            amount: creditInstallments.amount,
            dueDate: creditInstallments.dueDate,
            clientName: clients.name,
          })
          .from(creditInstallments)
          .leftJoin(credits, eq(creditInstallments.creditId, credits.id))
          .leftJoin(clients, eq(credits.clientId, clients.id))
          .where(and(isNull(creditInstallments.paidAt), lt(creditInstallments.dueDate, now)))
          .orderBy(creditInstallments.dueDate)
          .limit(50),

        db
          .select({
            id: creditInstallments.id,
            creditId: creditInstallments.creditId,
            number: creditInstallments.number,
            amount: creditInstallments.amount,
            dueDate: creditInstallments.dueDate,
            clientName: clients.name,
          })
          .from(creditInstallments)
          .leftJoin(credits, eq(creditInstallments.creditId, credits.id))
          .leftJoin(clients, eq(credits.clientId, clients.id))
          .where(and(isNull(creditInstallments.paidAt), gte(creditInstallments.dueDate, now), lte(creditInstallments.dueDate, in10Days)))
          .orderBy(creditInstallments.dueDate)
          .limit(50),

        // Créditos saldo_compuesto con firstDueDate vencida
        db
          .select({ id: credits.id, clientId: credits.clientId, amount: credits.originalAmount, dueDate: credits.firstDueDate, clientName: clients.name })
          .from(credits)
          .leftJoin(clients, eq(credits.clientId, clients.id))
          .where(and(eq(credits.status, 'activo'), eq(credits.creditType, 'saldo_compuesto'), isNotNull(credits.firstDueDate), lt(credits.firstDueDate, now)))
          .orderBy(credits.firstDueDate)
          .limit(50),

        // Créditos saldo_compuesto con firstDueDate próxima (7 días)
        db
          .select({ id: credits.id, clientId: credits.clientId, amount: credits.originalAmount, dueDate: credits.firstDueDate, clientName: clients.name })
          .from(credits)
          .leftJoin(clients, eq(credits.clientId, clients.id))
          .where(and(eq(credits.status, 'activo'), eq(credits.creditType, 'saldo_compuesto'), isNotNull(credits.firstDueDate), gte(credits.firstDueDate, now), lte(credits.firstDueDate, in10Days)))
          .orderBy(credits.firstDueDate)
          .limit(50),
      ])

    // Auto-mark reminders as vencido if past due
    const overdueReminderIds = allReminders
      .filter(r => r.status === 'pendiente' && new Date(r.dueDate) < now)
      .map(r => r.id)

    if (overdueReminderIds.length > 0) {
      await db
        .update(reminders)
        .set({ status: 'vencido' })
        .where(inArray(reminders.id, overdueReminderIds))
    }

    const updatedReminders = allReminders.map(r => ({
      ...r,
      status: overdueReminderIds.includes(r.id) ? ('vencido' as const) : r.status,
    }))

    const remindersOverdue = updatedReminders.filter(r => r.status === 'vencido')
    const remindersUpcoming = updatedReminders.filter(
      r => r.status === 'pendiente' && new Date(r.dueDate) <= in7Days,
    )
    const remindersPending = updatedReminders.filter(
      r => r.status === 'pendiente' && new Date(r.dueDate) > in7Days,
    )

    const criticalCount = overdueInstallments.length + remindersOverdue.length + overdueCreditInsts.length + overdueCreditsCC.length
    const upcomingCount = upcomingInstallments.length + remindersUpcoming.length + activeReservations.length + upcomingCreditInsts.length + upcomingCreditsCC.length
    const totalCount = criticalCount + upcomingCount + pendingOrders.length

    return {
      summary: { critical: criticalCount, upcoming: upcomingCount, total: totalCount },
      installments: { overdue: overdueInstallments, upcoming: upcomingInstallments },
      creditInstallments: { overdue: overdueCreditInsts, upcoming: upcomingCreditInsts },
      cuentaCorriente: { overdue: overdueCreditsCC, upcoming: upcomingCreditsCC },
      reservations: activeReservations,
      purchaseOrders: pendingOrders,
      reminders: { overdue: remindersOverdue, upcoming: remindersUpcoming, pending: remindersPending },
    }
  }
}
