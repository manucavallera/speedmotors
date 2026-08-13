import { describe, expect, it } from '@jest/globals'
import {
  createValuationDraft,
  projectDraftSellPrice,
  toValuationGroups,
  validateDraft,
} from './stockValuation'
import type { DraftGroup, ValuationGroup } from '../types/stock-valuation.types'

const group = (overrides: Partial<ValuationGroup> = {}): ValuationGroup => ({
  groupKey: 'honda\u001fwave\u001fs',
  brand: 'Honda',
  model: 'Wave',
  version: 'S',
  vehicleIds: [1],
  availableUnits: 1,
  reservedUnits: 0,
  totalUnits: 1,
  currentCostPrice: 100,
  currentSellPrice: 130,
  ...overrides,
})

describe('stock valuation draft', () => {
  it('creates editable strings without losing zero or mixed values', () => {
    expect(createValuationDraft([
      group({ currentCostPrice: 0, currentSellPrice: 0 }),
      group({ groupKey: 'mixed', currentCostPrice: null, currentSellPrice: null }),
    ])).toMatchObject([
      { costPrice: '0', currentSellPrice: 0, saleMode: 'unchanged' },
      { costPrice: '', currentSellPrice: null, saleMode: 'unchanged' },
    ])
  })

  it.each([
    ['manual price', { costPrice: '100', saleMode: 'manual' as const, manualSellPrice: '145' }, '30', 145],
    ['group margin', { costPrice: '100', saleMode: 'margin' as const, marginPercent: '20' }, '30', 120],
    ['general margin fallback', { costPrice: '100', saleMode: 'margin' as const, marginPercent: '' }, '30', 130],
    ['unchanged price', { costPrice: '100', saleMode: 'unchanged' as const, currentSellPrice: 125 }, '', 125],
  ])('projects %s', (_name, draft, generalMargin, expected) => {
    expect(projectDraftSellPrice(draft as DraftGroup, generalMargin)).toBe(expected)
  })

  it('validates cost, manual price, and margin ranges', () => {
    expect(validateDraft([
      { ...createValuationDraft([group()])[0], costPrice: '0' },
      { ...createValuationDraft([group({ groupKey: 'manual' })])[0], saleMode: 'manual', manualSellPrice: '' },
      { ...createValuationDraft([group({ groupKey: 'margin' })])[0], saleMode: 'margin', marginPercent: '1000.01' },
    ], '')).toEqual([
      'Honda Wave S: ingresá un costo mayor que cero',
      'Honda Wave S: ingresá un precio de venta manual válido',
      'Honda Wave S: ingresá un margen entre 0 y 1000',
    ])
  })

  it('omits empty optional strings from the API payload', () => {
    const draft = createValuationDraft([group()])
    draft[0].saleMode = 'margin'
    draft[0].marginPercent = ''

    expect(toValuationGroups(draft)).toEqual([{
      groupKey: group().groupKey,
      costPrice: 100,
      saleMode: 'margin',
    }])
  })
})
