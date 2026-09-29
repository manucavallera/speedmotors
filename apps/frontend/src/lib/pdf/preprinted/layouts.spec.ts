import { getPrintedFormLayout } from './layouts'
import { loadPrintOffset, savePrintOffset } from './settings'

describe('preprinted form layouts', () => {
  beforeEach(() => localStorage.clear())

  it('keeps the physical size of each source form', () => {
    expect(getPrintedFormLayout('invoice').pageSizeMm).toEqual([210, 297])
    expect(getPrintedFormLayout('remito').pageSizeMm).toEqual([215.9, 279.4])
  })

  it('keeps invoice quantity, unit price and subtotal columns separate', () => {
    const { detail } = getPrintedFormLayout('invoice')
    const columns = [detail.quantity, detail.unitPrice, detail.subtotal]
      .filter((field): field is NonNullable<typeof field> => Boolean(field))
      .sort((left, right) => left.x - right.x)

    expect(columns.every((field, index) => index === 0 || columns[index - 1].x + columns[index - 1].width <= field.x)).toBe(true)
  })

  it('keeps calibration offsets independent for each form', () => {
    savePrintOffset('invoice', { x: 1.5, y: -0.75 })

    expect(loadPrintOffset('invoice')).toEqual({ x: 1.5, y: -0.75 })
    expect(loadPrintOffset('remito')).toEqual({ x: 0, y: 0 })
  })

  it('falls back to a neutral offset for invalid saved calibration', () => {
    localStorage.setItem('speedmotors_preprinted_offsets', JSON.stringify({ invoice: { x: 'right', y: null } }))

    expect(loadPrintOffset('invoice')).toEqual({ x: 0, y: 0 })
  })
})
