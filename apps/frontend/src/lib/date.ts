export function todayDateInput() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Las fechas de deuda/pago son fechas de calendario, no instantes horarios.
// Mediodía UTC evita que Argentina las muestre como el día anterior.
export function dateInputToIso(date: string) {
  return `${date}T12:00:00.000Z`
}

export function formatDateOnly(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleDateString('es-AR', { ...options, timeZone: 'UTC' })
}
