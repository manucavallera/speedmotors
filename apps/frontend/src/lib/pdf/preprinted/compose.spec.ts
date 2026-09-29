import { PrintedFormOverflowError, composePreprintedForm } from './compose'
import type { PrintSale } from './types'

const sale: PrintSale = {
  id: 42,
  saleNumber: '2026-00042',
  invoiceType: 'B',
  createdAt: '2026-09-29T12:00:00.000Z',
  total: '1210.50',
  amountFormal: '700.00',
  paymentMethod: 'efectivo',
  items: [{ description: 'Motocicleta de prueba', quantity: 1, unitPrice: '1210.50', subtotal: '1210.50' }],
}

const dniClient = { name: 'Ana Pérez', dni: '40111222', condicionIva: 'consumidor_final' }

describe('composePreprintedForm', () => {
  it('uses a client DNI when no CUIT exists', () => {
    const commands = composePreprintedForm('invoice', sale, dniClient, { x: 0, y: 0 })

    expect(commands.some(command => command.text.includes('40111222'))).toBe(true)
  })

  it('prints formal amount for mixed invoices', () => {
    const commands = composePreprintedForm('invoice', { ...sale, invoiceType: 'mixto' }, dniClient, { x: 0, y: 0 })

    expect(commands.some(command => command.field === 'total' && command.text === '700,00')).toBe(true)
    expect(commands.some(command => command.field === 'total' && command.text === '1.210,50')).toBe(false)
  })

  it('splits remito dates and shifts each command by calibration offset', () => {
    const commands = composePreprintedForm('remito', sale, dniClient, { x: 2, y: -1 })

    expect(commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'dateDay', text: '29', x: 128, y: 22.5 }),
      expect.objectContaining({ field: 'dateMonth', text: '09', x: 153, y: 22.5 }),
      expect.objectContaining({ field: 'dateYear', text: '2026', x: 182, y: 22.5 }),
    ]))
  })

  it('rejects items that exceed the physical detail grid', () => {
    const items = Array.from({ length: 21 }, (_, index) => ({ description: `Ítem ${index + 1}`, quantity: 1, unitPrice: '10', subtotal: '10' }))

    expect(() => composePreprintedForm('remito', { ...sale, items }, dniClient, { x: 0, y: 0 }))
      .toThrow(PrintedFormOverflowError)
  })
})
