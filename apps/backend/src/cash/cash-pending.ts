import { and, eq, sql } from 'drizzle-orm'
import { cashMovements, cashSessions, pendingCashMovements } from '../db/schema'

// La apertura de caja usa el mismo lock. Así un cobro no puede quedar pendiente
// justo después de que una sesión nueva terminó de incorporar los pendientes.
export async function depositOrQueueMarina(tx: any, amount: number, userId: number, reason: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('cash:marina'))`)

  const [session] = await tx.select({ id: cashSessions.id }).from(cashSessions)
    .where(and(eq(cashSessions.status, 'abierta'), eq(cashSessions.area, 'marina')))
    .limit(1)

  const values = {
    userId,
    type: 'deposito' as const,
    amount: amount.toString(),
    reason,
  }

  if (session) {
    await tx.insert(cashMovements).values({ ...values, sessionId: session.id })
    return { pending: false, sessionId: session.id }
  }

  const [pending] = await tx.insert(pendingCashMovements)
    .values({ ...values, area: 'marina' })
    .returning()
  return { pending: true, pendingId: pending.id }
}
