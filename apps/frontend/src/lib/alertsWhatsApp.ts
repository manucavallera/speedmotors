interface FixedFinancingMessageData {
  clientName: string | null
  installmentNumber: number
  amount: string
  dueDate: string
}

interface FreeFinancingMessageData {
  clientName: string | null
  totalAmount: string
}

function formatAmount(value: string): string {
  const amount = Number(value)
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function buildFixedFinancingMessage({ clientName, installmentNumber, amount, dueDate }: FixedFinancingMessageData): string {
  const name = clientName || 'cliente'
  return `Hola ${name}, ¿cómo está? Lo contactamos desde SpeedMotors.
Revisando el estado de cuenta, notamos que la cuota N° ${installmentNumber} de su financiación por $${formatAmount(amount)} venció el pasado ${formatDate(dueDate)}.
Comprendemos que pueden surgir imprevistos o descuidos, por lo que nos ponemos a su disposición para conversar sobre su situación particular y evaluar alternativas que le permitan regularizar el pago de manera cómoda.
Le adjuntamos su estado de cuenta actualizado a la fecha. Quedamos atentos a su respuesta. Lo saludamos cordialmente.`
}

export function buildFreeFinancingMessage({ clientName, totalAmount }: FreeFinancingMessageData): string {
  const name = clientName || 'cliente'
  return `Hola ${name}, ¿cómo está? Lo contactamos desde SpeedMotors para enviarle el estado de cuenta actualizado a la fecha.
Al día de hoy, el saldo pendiente es de $${formatAmount(totalAmount)}, el cual incluye la actualización de intereses correspondientes a este último mes.
Entendemos que los pagos dependen de su disponibilidad, por lo que le enviamos este resumen para que pueda tener un control claro. Estamos a su disposición para conversar si desea realizar una entrega o si necesita revisar alguna alternativa para ir cancelando el saldo.
Le adjunto el detalle. Quedamos atentos a sus comentarios, saludos cordiales.`
}
