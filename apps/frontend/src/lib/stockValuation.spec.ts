import { describe, expect, it } from '@jest/globals'
import {
  createValuationDraft,
  projectDraftSellPrice,
  safeValuationReturnTo,
  toValuationGroups,
  validateDraft,
  valuationClosedLabel,
  valuationDraftChanged,
  valuationGroupChange,
  valuationUnitLabel,
  vehicleEditUrl,
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
  units: [],
  currentCostPrice: 100,
  currentSellPrice: 130,
  ...overrides,
})

describe('valuation UX helpers', () => {
  it('detects cost, sale and unchanged groups', () => {
    const base = group({ currentCostPrice: 100, currentSellPrice: 130 })
    expect(valuationGroupChange({ ...createValuationDraft([base])[0], costPrice: '110' })).toBe('cost')
    expect(valuationGroupChange({ ...createValuationDraft([base])[0], saleMode: 'manual', manualSellPrice: '140' })).toBe('sale')
    expect(valuationGroupChange({ ...createValuationDraft([base])[0], costPrice: '110', saleMode: 'margin', marginPercent: '20' })).toBe('both')
    expect(valuationGroupChange(createValuationDraft([base])[0])).toBe('none')
  })

  it('reports only effective price changes', () => {
    const mixedCostDraft = createValuationDraft([group({
      groupKey: 'mixed-cost',
      currentCostPrice: null,
      currentSellPrice: null,
    })])[0]
    const manualSamePriceDraft = {
      ...createValuationDraft([group({ groupKey: 'manual-same', currentSellPrice: 130 })])[0],
      saleMode: 'manual' as const,
      manualSellPrice: '130',
    }
    const manualDifferentPriceDraft = {
      ...manualSamePriceDraft,
      groupKey: 'manual-different',
      manualSellPrice: '140',
    }
    const marginSamePriceDraft = {
      ...createValuationDraft([group({ groupKey: 'margin-same', currentSellPrice: 125 })])[0],
      saleMode: 'margin' as const,
      marginPercent: '',
    }

    expect(valuationGroupChange(mixedCostDraft, '')).toBe('none')
    expect(valuationGroupChange(manualSamePriceDraft, '')).toBe('none')
    expect(valuationGroupChange(manualDifferentPriceDraft, '')).toBe('sale')
    expect(valuationGroupChange(marginSamePriceDraft, '25')).toBe('none')
  })

  it('reports clearing an existing cost as a change', () => {
    const blankExistingCostDraft = {
      ...createValuationDraft([group({ currentCostPrice: 100 })])[0],
      costPrice: '',
    }

    expect(valuationGroupChange(blankExistingCostDraft, '')).toBe('cost')
  })

  it('detects unsaved valuation inputs', () => {
    const groups = [group({ currentCostPrice: 100 })]
    expect(valuationDraftChanged(createValuationDraft(groups), '', groups)).toBe(false)
    expect(valuationDraftChanged([{ ...createValuationDraft(groups)[0], costPrice: '101' }], '', groups)).toBe(true)
    expect(valuationDraftChanged(createValuationDraft(groups), '25', groups)).toBe(true)
  })

  it('builds an editable vehicle URL with a safe return path', () => {
    expect(vehicleEditUrl(42, 'SM-001', '2026-08')).toBe('/vehicles?edit=42&search=SM-001&returnTo=%2Fstock-valuation%3Fperiod%3D2026-08')
    expect(safeValuationReturnTo('/stock-valuation?period=2026-08')).toBe('/stock-valuation?period=2026-08')
    expect(safeValuationReturnTo('https://evil.example')).toBeNull()
  })

  it('formats the identifying model label shown inside an expanded unit card', () => {
    expect(valuationUnitLabel({ brand: 'Guerrero', model: 'Trip', version: 'Full' })).toBe('Guerrero Trip Full')
    expect(valuationUnitLabel({ brand: 'Guerrero', model: 'Trip', version: null })).toBe('Guerrero Trip Sin versión')
  })

  it('shows both the date and time for a closed period', () => {
    const closedAt = '2026-08-13T17:45:00.000Z'
    expect(valuationClosedLabel(closedAt)).toBe(
      `Cerrado ${new Date(closedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`,
    )
  })
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
    ['decimal half cents', { costPrice: '10.075', saleMode: 'margin' as const, marginPercent: '0' }, '', 10.08],
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
