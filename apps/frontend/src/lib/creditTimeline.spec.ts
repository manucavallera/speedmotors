import { describe, expect, it } from 'vitest'
import { sortCreditEvents } from './creditTimeline'

const runningBalances = (events: { type: string; amount: number }[]) => {
  let running = 0
  return events.map(e => (running = e.type === 'pago' ? running - e.amount : running + e.amount))
}

describe('sortCreditEvents', () => {
  it('aplica el interés del período antes de un pago hecho antes del vencimiento', () => {
    const events = [
      { date: '2026-09-17T12:00:00.000Z', type: 'carga', amount: 1992326 },
      { date: '2026-10-14T12:00:00.000Z', type: 'pago', amount: 500000 },
      { date: '2026-10-17T12:00:00.000Z', type: 'interes', amount: 99616.3 },
    ]
    const sorted = sortCreditEvents(events, '2026-09-17T12:00:00.000Z', '2026-10-17T12:00:00.000Z')
    expect(sorted.map(e => e.type)).toEqual(['carga', 'interes', 'pago'])
    expect(runningBalances(sorted)[2]).toBeCloseTo(1591942.3, 2)
  })

  it('un pago de un mes anterior al primer vencimiento reduce la base', () => {
    const events = [
      { date: '2026-08-01T12:00:00.000Z', type: 'carga', amount: 1000 },
      { date: '2026-09-20T12:00:00.000Z', type: 'pago', amount: 100 },
      { date: '2026-10-17T12:00:00.000Z', type: 'interes', amount: 45 },
    ]
    const sorted = sortCreditEvents(events, '2026-08-01T12:00:00.000Z', '2026-10-17T12:00:00.000Z')
    expect(sorted.map(e => e.type)).toEqual(['carga', 'pago', 'interes'])
  })

  it('en períodos siguientes el pago va después del cargo de su período', () => {
    const events = [
      { date: '2026-09-17T12:00:00.000Z', type: 'carga', amount: 1000 },
      { date: '2026-10-17T12:00:00.000Z', type: 'interes', amount: 50 },
      { date: '2026-10-20T12:00:00.000Z', type: 'pago', amount: 200 },
      { date: '2026-11-17T12:00:00.000Z', type: 'interes', amount: 52.5 },
    ]
    const sorted = sortCreditEvents(events, '2026-09-17T12:00:00.000Z', '2026-10-17T12:00:00.000Z')
    expect(sorted.map(e => e.date.slice(0, 10))).toEqual(['2026-09-17', '2026-10-17', '2026-11-17', '2026-10-20'])
  })
})
