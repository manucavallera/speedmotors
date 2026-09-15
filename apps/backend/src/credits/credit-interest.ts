export function getFirstInterestChargeDate(startDate: Date, firstDueDate: Date | null): Date {
  const firstChargeDate = new Date(firstDueDate || startDate)
  if (!firstDueDate) firstChargeDate.setUTCMonth(firstChargeDate.getUTCMonth() + 1)
  return firstChargeDate
}

function isSameCalendarDate(left: Date, right: Date): boolean {
  return left.getUTCFullYear() === right.getUTCFullYear()
    && left.getUTCMonth() === right.getUTCMonth()
    && left.getUTCDate() === right.getUTCDate()
}

// El pago reduce la base solamente si pertenece a un período ya cerrado.
// Antes del primer vencimiento, los pagos de meses anteriores sí reducen la base.
// Luego, cada período corre desde el día posterior al vencimiento anterior hasta el día 10.
export function paymentReducesInterestBase(
  paymentDate: Date,
  chargeDate: Date,
  firstChargeDate: Date,
): boolean {
  if (isSameCalendarDate(chargeDate, firstChargeDate)) {
    const firstDueMonth = new Date(Date.UTC(chargeDate.getUTCFullYear(), chargeDate.getUTCMonth(), 1))
    return paymentDate < firstDueMonth
  }

  const previousChargeDate = new Date(chargeDate)
  previousChargeDate.setUTCMonth(previousChargeDate.getUTCMonth() - 1)
  return paymentDate <= previousChargeDate
}
