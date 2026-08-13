import { BadRequestException, ConflictException } from '@nestjs/common'
import { getTableName } from 'drizzle-orm'
import { groupEligibleVehicles, stockFingerprint } from './stock-valuation.domain'
import { StockValuationsService } from './stock-valuations.service'

interface VehicleRow {
  id: number
  type: 'moto' | 'lancha'
  brand: string
  model: string
  version: string | null
  status: 'disponible' | 'reservado' | 'vendido'
  costPrice: string
  sellPrice: string
  updatedAt: Date
}

class Query<T> implements PromiseLike<T[]> {
  constructor(private readonly rows: T[]) {}
  where() { return this }
  for() { return this }
  orderBy() { return this }
  limit(count: number) { return new Query(this.rows.slice(0, count)) }
  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.rows).then(onfulfilled, onrejected)
  }
}

class FakeDatabase {
  vehicles: VehicleRow[] = []
  headers: Record<string, unknown>[] = []
  lines: Record<string, unknown>[] = []
  vehicleUpdates: Record<string, unknown>[] = []
  transactionCalls = 0
  deletedLines = 0

  select() {
    return {
      from: (table: unknown) => {
        const name = getTableName(table as never)
        if (name === 'vehicles') return new Query(this.vehicles)
        if (name === 'stock_valuations') return new Query(this.headers)
        return new Query(this.lines)
      },
    }
  }

  update(table: unknown) {
    const name = getTableName(table as never)
    return {
      set: (values: Record<string, unknown>) => ({
        where: () => {
          if (name === 'vehicles') this.vehicleUpdates.push(values)
          if (name === 'stock_valuations') {
            this.headers[0] = { ...this.headers[0], ...values }
            return { returning: async () => [this.headers[0]] }
          }
          return Promise.resolve([])
        },
      }),
    }
  }

  insert(table: unknown) {
    const name = getTableName(table as never)
    return {
      values: (values: Record<string, unknown> | Record<string, unknown>[]) => ({
        returning: async () => {
          const list = Array.isArray(values) ? values : [values]
          const target = name === 'stock_valuations' ? this.headers : this.lines
          const inserted = list.map((value) => ({ id: target.length + 1, ...value }))
          target.push(...inserted)
          return inserted
        },
      }),
    }
  }

  delete() {
    return {
      where: async () => {
        this.deletedLines += this.lines.length
        this.lines = []
      },
    }
  }

  async transaction<T>(work: (transaction: FakeDatabase) => Promise<T>): Promise<T> {
    this.transactionCalls += 1
    return work(this)
  }
}

const vehicle = (overrides: Partial<VehicleRow> = {}): VehicleRow => ({
  id: 1,
  type: 'moto',
  brand: 'Honda',
  model: 'Wave',
  version: 'S',
  status: 'disponible',
  costPrice: '100',
  sellPrice: '130',
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  ...overrides,
})

const serviceWith = (database: FakeDatabase) =>
  new StockValuationsService(database as never)

const closeRequest = (rows: VehicleRow[]) => {
  const eligible = rows.filter((row) => row.type === 'moto' && row.status !== 'vendido')
  return {
    period: '2026-08',
    stockFingerprint: stockFingerprint(eligible as never),
    groups: groupEligibleVehicles(eligible as never).map((group) => ({
      groupKey: group.groupKey,
      costPrice: 110,
      saleMode: 'margin' as const,
      marginPercent: 20,
    })),
  }
}

describe('StockValuationsService', () => {
  it('filters any brand of eligible motos before grouping', async () => {
    const database = new FakeDatabase()
    database.vehicles = [
      vehicle(),
      vehicle({ id: 2, brand: 'Zanella', model: 'ZB', status: 'reservado' }),
      vehicle({ id: 3, type: 'lancha', brand: 'Bermuda' }),
      vehicle({ id: 4, brand: 'Motomel', status: 'vendido' }),
    ]

    const current = await serviceWith(database).current('2026-08')

    expect(current.groups.map((group) => group.brand)).toEqual(['Honda', 'Zanella'])
    expect(current.groups).toHaveLength(2)
  })

  it('rejects a stale stock fingerprint before writing', async () => {
    const database = new FakeDatabase()
    database.vehicles = [vehicle()]

    const promise = serviceWith(database).close({
      ...closeRequest(database.vehicles),
      stockFingerprint: 'stale',
    })
    await expect(promise).rejects.toThrow(ConflictException)
    await expect(promise).rejects.toMatchObject({ response: { code: 'STALE_STOCK' } })
    expect(database.vehicleUpdates).toHaveLength(0)
    expect(database.headers).toHaveLength(0)
  })

  it('updates group prices and writes the snapshot in one transaction', async () => {
    const database = new FakeDatabase()
    database.vehicles = [vehicle(), vehicle({ id: 2, status: 'reservado' })]

    const result = await serviceWith(database).close(closeRequest(database.vehicles))

    expect(database.transactionCalls).toBe(1)
    expect(database.vehicleUpdates).toEqual([{ costPrice: '110.00', sellPrice: '132.00', updatedAt: expect.any(Date) }])
    expect(database.headers).toHaveLength(1)
    expect(database.lines).toHaveLength(1)
    expect(result.totals.totalUnits).toBe(2)
  })

  it('refuses an existing period without explicit replacement', async () => {
    const database = new FakeDatabase()
    database.vehicles = [vehicle()]
    database.headers = [{ id: 7, period: '2026-08' }]

    const promise = serviceWith(database).close(closeRequest(database.vehicles))
    await expect(promise).rejects.toThrow(ConflictException)
    await expect(promise).rejects.toMatchObject({ response: { code: 'PERIOD_EXISTS' } })
  })

  it('returns a client error for an invalid valuation request', async () => {
    const database = new FakeDatabase()
    database.vehicles = [vehicle()]
    const request = closeRequest(database.vehicles)
    request.groups[0].costPrice = 0

    await expect(serviceWith(database).preview(request)).rejects.toThrow(BadRequestException)
  })

  it('replaces the existing header and frozen lines when confirmed', async () => {
    const database = new FakeDatabase()
    database.vehicles = [vehicle()]
    database.headers = [{ id: 7, period: '2026-08' }]
    database.lines = [{ id: 9, valuationId: 7, brand: 'Old' }]

    await serviceWith(database).close({
      ...closeRequest(database.vehicles),
      replaceExisting: true,
    })

    expect(database.deletedLines).toBe(1)
    expect(database.headers).toHaveLength(1)
    expect(database.lines).toMatchObject([{ valuationId: 7, brand: 'Honda' }])
  })

  it('reads frozen history independently from current vehicles', async () => {
    const database = new FakeDatabase()
    database.vehicles = [vehicle({ brand: 'Changed later' })]
    database.headers = [{ id: 7, period: '2026-07' }]
    database.lines = [{ id: 9, valuationId: 7, brand: 'Honda', model: 'Wave' }]

    const detail = await serviceWith(database).findOne(7)

    expect(detail.lines).toMatchObject([{ brand: 'Honda', model: 'Wave' }])
  })
})
