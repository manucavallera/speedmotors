import { buildFixedFinancingMessage, buildFreeFinancingMessage } from './alertsWhatsApp'

describe('mensajes de financiación para WhatsApp', () => {
  it('genera el mensaje de financiación fija con los datos reales de la cuota', () => {
    expect(buildFixedFinancingMessage({
      clientName: 'María López',
      installmentNumber: 3,
      amount: '125000',
      dueDate: '2026-09-10T00:00:00.000Z',
    })).toBe(`Hola María López, ¿cómo está? Lo contactamos desde SpeedMotors.
Revisando el estado de cuenta, notamos que la cuota N° 3 de su financiación por $125.000 venció el pasado 10/09/2026.
Comprendemos que pueden surgir imprevistos o descuidos, por lo que nos ponemos a su disposición para conversar sobre su situación particular y evaluar alternativas que le permitan regularizar el pago de manera cómoda.
Le adjuntamos su estado de cuenta actualizado a la fecha. Quedamos atentos a su respuesta. Lo saludamos cordialmente.`)
  })

  it('genera el mensaje de financiación libre con el saldo actualizado', () => {
    expect(buildFreeFinancingMessage({
      clientName: 'María López',
      totalAmount: '987654.5',
    })).toBe(`Hola María López, ¿cómo está? Lo contactamos desde SpeedMotors para enviarle el estado de cuenta actualizado a la fecha.
Al día de hoy, el saldo pendiente es de $987.654,50, el cual incluye la actualización de intereses correspondientes a este último mes.
Entendemos que los pagos dependen de su disponibilidad, por lo que le enviamos este resumen para que pueda tener un control claro. Estamos a su disposición para conversar si desea realizar una entrega o si necesita revisar alguna alternativa para ir cancelando el saldo.
Le adjunto el detalle. Quedamos atentos a sus comentarios, saludos cordiales.`)
  })
})
