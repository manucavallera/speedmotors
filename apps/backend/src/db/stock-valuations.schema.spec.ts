import { getTableName } from 'drizzle-orm'
import { stockValuationLines, stockValuations } from './schema'

describe('stock valuation schema', () => {
  it('exports the monthly snapshot header and line tables', () => {
    expect(getTableName(stockValuations)).toBe('stock_valuations')
    expect(getTableName(stockValuationLines)).toBe('stock_valuation_lines')
  })
})
