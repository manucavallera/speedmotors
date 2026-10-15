// Ordena los movimientos de un saldo variable igual que el backend (credit-interest.ts):
// el interés de un período se calcula sobre el saldo previo a los pagos de ese período,
// así que esos pagos van después del cargo aunque su fecha sea anterior.
export interface CreditTimelineEvent {
  date: string
  type: string
}

function firstChargeDate(startDate: string, firstDueDate?: string | null): Date {
  const d = new Date(firstDueDate || startDate)
  if (!firstDueDate) d.setUTCMonth(d.getUTCMonth() + 1)
  return d
}

function chargeDateForPayment(paymentDate: Date, first: Date): Date {
  const d = new Date(first)
  while (d < paymentDate) d.setUTCMonth(d.getUTCMonth() + 1)
  return d
}

function paymentReducesInterestBase(paymentDate: Date, chargeDate: Date, first: Date): boolean {
  if (chargeDate.getTime() === first.getTime()) {
    return paymentDate < new Date(Date.UTC(chargeDate.getUTCFullYear(), chargeDate.getUTCMonth(), 1))
  }
  const previous = new Date(chargeDate)
  previous.setUTCMonth(previous.getUTCMonth() - 1)
  return paymentDate <= previous
}

export function sortCreditEvents<T extends CreditTimelineEvent>(events: T[], startDate: string, firstDueDate?: string | null): T[] {
  const first = firstChargeDate(startDate, firstDueDate)
  const key = (e: T): number => {
    const date = new Date(e.date)
    if (e.type !== 'pago') return date.getTime()
    const charge = chargeDateForPayment(date, first)
    return paymentReducesInterestBase(date, charge, first) ? date.getTime() : charge.getTime() + 1
  }
  return [...events].sort((a, b) => key(a) - key(b))
}
