import {
  EligibleVehicle,
  groupEligibleVehicles,
  projectValuation,
  projectedSell,
  stockFingerprint,
} from './stock-valuation.domain'

const vehicle = (overrides: Partial<EligibleVehicle> = {}): EligibleVehicle => ({
  id: 1,
  brand: 'Guerrero',
  model: 'Trip',
  version: 'TA',
  status: 'disponible',
  costPrice: '100',
  sellPrice: '130',
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  ...overrides,
})

describe('groupEligibleVehicles', () => {
  it('groups case-insensitively while keeping versions separate', () => {
    const rows = [
      vehicle(),
      vehicle({
        id: 2,
        brand: ' guerrero ',
        model: 'TRIP',
        version: 'ta',
        status: 'reservado',
      }),
      vehicle({ id: 3, version: 'TF' }),
    ]

    expect(groupEligibleVehicles(rows)).toMatchObject([
      {
        brand: 'Guerrero',
        model: 'Trip',
        version: 'TA',
        availableUnits: 1,
        reservedUnits: 1,
        totalUnits: 2,
      },
      {
        brand: 'Guerrero',
        model: 'Trip',
        version: 'TF',
        availableUnits: 1,
        reservedUnits: 0,
        totalUnits: 1,
      },
    ])
  })

  it('reports mixed current prices as null', () => {
    const [group] = groupEligibleVehicles([
      vehicle(),
      vehicle({ id: 2, costPrice: '110', sellPrice: '140' }),
    ])

    expect(group.currentCostPrice).toBeNull()
    expect(group.currentSellPrice).toBeNull()
  })
})

describe('projectedSell', () => {
  it.each([
    ['manual wins over every margin', { mode: 'manual' as const, manual: 150, groupMargin: 20, generalMargin: 30, cost: 100, current: 90 }, 150],
    ['group margin wins over general margin', { mode: 'margin' as const, groupMargin: 20, generalMargin: 30, cost: 100, current: 90 }, 120],
    ['general margin is the fallback for margin mode', { mode: 'margin' as const, generalMargin: 30, cost: 100, current: 90 }, 130],
    ['unchanged keeps the current sale price', { mode: 'unchanged' as const, cost: 100, current: 90 }, 90],
    ['money is rounded to cents', { mode: 'margin' as const, groupMargin: 0, cost: 100.005, current: 90 }, 100.01],
    ['decimal half cents round up reliably', { mode: 'margin' as const, groupMargin: 0, cost: 10.075, current: 9 }, 10.08],
  ])('%s', (_name, input, expected) => {
    expect(projectedSell(input)).toBe(expected)
  })
})

describe('projectValuation', () => {
  it('projects every generic brand-model-version group and totals in cents', () => {
    const rows = [
      vehicle({ brand: 'Honda', model: 'Wave', version: 'S', sellPrice: '0' }),
      vehicle({ id: 2, brand: 'Honda', model: 'Wave', version: 'S', status: 'reservado', sellPrice: '0' }),
      vehicle({ id: 3, brand: 'Zanella', model: 'ZB', version: null, costPrice: '80', sellPrice: '90' }),
    ]
    const [honda, zanella] = groupEligibleVehicles(rows)

    const result = projectValuation(rows, {
      period: '2026-08',
      stockFingerprint: stockFingerprint(rows),
      generalMarginPercent: 30,
      groups: [
        { groupKey: honda.groupKey, costPrice: 100.005, saleMode: 'margin' },
        { groupKey: zanella.groupKey, costPrice: 80, saleMode: 'unchanged' },
      ],
    })

    expect(result.groups).toMatchObject([
      {
        brand: 'Honda',
        model: 'Wave',
        version: 'S',
        availableUnits: 1,
        reservedUnits: 1,
        costPrice: 100.01,
        sellPrice: 130.01,
        totalCost: 200.02,
        totalSell: 260.02,
      },
      {
        brand: 'Zanella',
        model: 'ZB',
        version: null,
        costPrice: 80,
        sellPrice: 90,
        totalCost: 80,
        totalSell: 90,
      },
    ])
    expect(result.totals).toEqual({
      availableUnits: 2,
      reservedUnits: 1,
      totalUnits: 3,
      totalCost: 280.02,
      totalSell: 350.02,
      potentialMargin: 70,
      unpricedSaleUnits: 0,
    })
  })

  it('counts zero unchanged sale prices as unpriced units', () => {
    const rows = [vehicle({ sellPrice: '0' })]
    const [group] = groupEligibleVehicles(rows)

    const result = projectValuation(rows, {
      period: '2026-08',
      stockFingerprint: stockFingerprint(rows),
      groups: [{ groupKey: group.groupKey, costPrice: 100, saleMode: 'unchanged' }],
    })

    expect(result.totals.unpricedSaleUnits).toBe(1)
    expect(result.totals.totalSell).toBe(0)
  })

  it.each([
    ['zero cost', { costPrice: 0, saleMode: 'unchanged' as const }, 'costo mayor que cero'],
    ['margin over 1000', { costPrice: 100, saleMode: 'margin' as const, marginPercent: 1000.01 }, 'margen entre 0 y 1000'],
    ['missing margin', { costPrice: 100, saleMode: 'margin' as const }, 'margen'],
    ['missing manual price', { costPrice: 100, saleMode: 'manual' as const }, 'precio de venta manual'],
  ])('rejects %s', (_name, edit, message) => {
    const rows = [vehicle()]
    const [group] = groupEligibleVehicles(rows)

    expect(() => projectValuation(rows, {
      period: '2026-08',
      stockFingerprint: stockFingerprint(rows),
      groups: [{ groupKey: group.groupKey, ...edit }],
    })).toThrow(message)
  })

  it('requires exactly one edit for every known group', () => {
    const rows = [vehicle()]

    expect(() => projectValuation(rows, {
      period: '2026-08',
      stockFingerprint: stockFingerprint(rows),
      groups: [],
    })).toThrow('todos los grupos')
  })
})
