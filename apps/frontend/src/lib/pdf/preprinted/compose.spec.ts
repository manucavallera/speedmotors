import { PrintedFormOverflowError, composePreprintedForm } from './compose'
import type { PrintSale } from './types'

const sale: PrintSale = {
  id: 42,
  saleNumber: '2026-00042',
  invoiceType: 'B',
  createdAt: '2026-09-29T12:00:00.000Z',
  total: '1210.50',
  amountFormal: '700.00',
  subtotal: '1210.50',
  discount: '0',
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
    const mixedSale: PrintSale = {
      ...sale,
      invoiceType: 'mixto',
      items: [
        { description: 'Formal', quantity: 1, unitPrice: '700', subtotal: '700', ingresoTipo: 'blanco' },
        { description: 'Informal', quantity: 1, unitPrice: '510.50', subtotal: '510.50', ingresoTipo: 'negro' },
      ],
    }
    const commands = composePreprintedForm('invoice', mixedSale, dniClient, { x: 0, y: 0 })

    expect(commands.some(command => command.field === 'total' && command.text === '700,00')).toBe(true)
    expect(commands.some(command => command.field === 'total' && command.text === '1.210,50')).toBe(false)
    expect(commands.some(command => command.field === 'description' && command.text === 'Informal')).toBe(false)
  })

  it('allocates a sale discount proportionally to invoice detail rows', () => {
    const commands = composePreprintedForm('invoice', {
      ...sale,
      subtotal: '1000',
      total: '900',
      discount: '100',
      items: [
        { description: 'Primero', quantity: 1, unitPrice: '600', subtotal: '600' },
        { description: 'Segundo', quantity: 1, unitPrice: '400', subtotal: '400' },
      ],
    }, dniClient, { x: 0, y: 0 })

    expect(commands.some(command => command.field === 'unitPrice' && command.text === '540,00')).toBe(true)
    expect(commands.some(command => command.field === 'unitPrice' && command.text === '360,00')).toBe(true)
    expect(commands.some(command => command.field === 'subtotal' && command.text === '540,00')).toBe(true)
  })

  it('prints net, 21% VAT and total for an A invoice', () => {
    const commands = composePreprintedForm('invoice', { ...sale, invoiceType: 'A' }, dniClient, { x: 0, y: 0 })

    expect(commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'subtotal', text: '1.000,41' }),
      expect.objectContaining({ field: 'vat', text: '210,09' }),
      expect.objectContaining({ field: 'total', text: '1.210,50' }),
    ]))
    expect(commands.some(command => command.field === 'subtotal' && command.y < 150 && command.text === '1.000,41')).toBe(true)
  })

  it('assigns invoice rounding residue to the last detail row', () => {
    const commands = composePreprintedForm('invoice', {
      ...sale,
      invoiceType: 'A',
      total: '360',
      subtotal: '300',
      items: ['Primero', 'Segundo', 'Tercero'].map(description => ({ description, quantity: 1, unitPrice: '100', subtotal: '100' })),
    }, dniClient, { x: 0, y: 0 })
    const detailSubtotals = commands.filter(command => command.field === 'subtotal' && command.y < 150).map(command => command.text)
    const detailUnitPrices = commands.filter(command => command.field === 'unitPrice').map(command => command.text)

    expect(detailSubtotals).toEqual(['99,17', '99,17', '99,18'])
    expect(detailUnitPrices).toEqual(['99,17', '99,17', '99,18'])
    expect(detailSubtotals.reduce((sum, value) => sum + Number(value.replace('.', '').replace(',', '.')), 0)).toBe(297.52)
  })

  it('keeps unit price consistent with a multi-quantity net subtotal', () => {
    const commands = composePreprintedForm('invoice', {
      ...sale,
      invoiceType: 'A',
      total: '360',
      subtotal: '300',
      items: [{ description: 'Lote', quantity: 3, unitPrice: '100', subtotal: '300' }],
    }, dniClient, { x: 0, y: 0 })

    expect(commands.some(command => command.field === 'unitPrice' && command.text === '99,1733')).toBe(true)
    expect(commands.some(command => command.field === 'subtotal' && command.y < 150 && command.text === '297,52')).toBe(true)
  })

  it('uses the formal amount as subtotal and total for mixed invoices', () => {
    const commands = composePreprintedForm('invoice', {
      ...sale,
      invoiceType: 'mixto',
      items: [{ description: 'Formal', quantity: 1, unitPrice: '700', subtotal: '700', ingresoTipo: 'blanco' }],
    }, dniClient, { x: 0, y: 0 })

    expect(commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'subtotal', text: '700,00' }),
      expect.objectContaining({ field: 'total', text: '700,00' }),
    ]))
    expect(commands.some(command => command.field === 'vat')).toBe(false)
  })

  it('splits remito dates and shifts each command by calibration offset', () => {
    const commands = composePreprintedForm('remito', sale, dniClient, { x: 2, y: -1 })

    expect(commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'dateDay', text: '29', x: 128, y: 22.5 }),
      expect.objectContaining({ field: 'dateMonth', text: '09', x: 153, y: 22.5 }),
      expect.objectContaining({ field: 'dateYear', text: '2026', x: 182, y: 22.5 }),
    ]))
  })

  it('marks monotributo using the stored client IVA value', () => {
    const commands = composePreprintedForm('remito', sale, { ...dniClient, condicionIva: 'monotributo' }, { x: 0, y: 0 })

    expect(commands.some(command => command.field === 'ivaMonotributo' && command.text === 'X')).toBe(true)
    expect(commands.some(command => command.field === 'ivaConsumer')).toBe(false)
  })

  it('rejects items that exceed the physical detail grid', () => {
    const items = Array.from({ length: 21 }, (_, index) => ({ description: `Ítem ${index + 1}`, quantity: 1, unitPrice: '10', subtotal: '10' }))

    expect(() => composePreprintedForm('remito', { ...sale, items }, dniClient, { x: 0, y: 0 }))
      .toThrow(PrintedFormOverflowError)
  })

  it.each([
    { kind: 'invoice' as const, maxLines: 24 },
    { kind: 'remito' as const, maxLines: 20 },
  ])('accepts $maxLines single-line rows on the $kind form', ({ kind, maxLines }) => {
    const items = Array.from({ length: maxLines }, (_, index) => ({ description: `Ítem ${index + 1}`, quantity: 1, unitPrice: '10', subtotal: '10' }))

    expect(() => composePreprintedForm(kind, { ...sale, items }, dniClient, { x: 0, y: 0 })).not.toThrow()
  })
})
