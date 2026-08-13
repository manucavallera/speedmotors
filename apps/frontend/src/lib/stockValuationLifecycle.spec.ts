import { describe, expect, it } from '@jest/globals'
import {
  acceptValuationPreview,
  beginValuationPreview,
  createValuationLifecycle,
  failValuationPreview,
  invalidateValuationDraft,
  isValuationPreviewRequestCurrent,
  isValuationPreviewRequestLatest,
  isValuationPreviewReady,
  shouldAdoptValuationSource,
  valuationClosePayload,
  valuationPreviewBlockReason,
  valuationRefreshCanApply,
  valuationRefreshToken,
  valuationSource,
} from './stockValuationLifecycle'
import type { ValuationRequestPayload } from '../types/stock-valuation.types'

const requestPayload = (
  overrides: Partial<ValuationRequestPayload> = {},
): ValuationRequestPayload => ({
  period: '2026-08',
  stockFingerprint: 'stock-a',
  groups: [{
    groupKey: 'honda\u001fwave\u001fs',
    costPrice: 100,
    saleMode: 'unchanged',
  }],
  ...overrides,
})

const projection = (payload: ValuationRequestPayload) => ({
  period: payload.period,
  stockFingerprint: payload.stockFingerprint,
  groups: [],
  totals: {
    availableUnits: 1,
    reservedUnits: 0,
    totalUnits: 1,
    totalCost: 100,
    totalSell: 130,
    potentialMargin: 30,
    unpricedSaleUnits: 0,
  },
})

describe('stock valuation preview lifecycle', () => {
  it.each(['edit', 'reset', 'period change'])('rejects a late preview after a draft %s even when the payload returns to the same values', () => {
    const started = beginValuationPreview(createValuationLifecycle(), requestPayload())
    const invalidated = invalidateValuationDraft(started.lifecycle)

    expect(isValuationPreviewRequestCurrent(
      invalidated,
      started.request,
      requestPayload(),
    )).toBe(false)
  })

  it('requires the latest request and the exact current payload before installing a preview', () => {
    const first = beginValuationPreview(createValuationLifecycle(), requestPayload())
    const secondPayload = requestPayload({
      groups: [{
        groupKey: 'honda\u001fwave\u001fs',
        costPrice: 125,
        saleMode: 'manual',
        manualSellPrice: 160,
      }],
    })
    const second = beginValuationPreview(first.lifecycle, secondPayload)

    expect(isValuationPreviewRequestLatest(second.lifecycle, first.request)).toBe(false)
    expect(isValuationPreviewRequestCurrent(second.lifecycle, first.request, requestPayload())).toBe(false)
    expect(isValuationPreviewRequestCurrent(second.lifecycle, second.request, requestPayload())).toBe(false)
    expect(isValuationPreviewRequestCurrent(second.lifecycle, second.request, secondPayload)).toBe(true)
  })

  it('closes with the payload captured by the accepted preview, not a later draft', () => {
    const previewedPayload = requestPayload()
    const started = beginValuationPreview(createValuationLifecycle(), previewedPayload)
    const accepted = acceptValuationPreview(
      started.lifecycle,
      started.request,
      previewedPayload,
      projection(previewedPayload),
    ).preview
    const laterPayload = requestPayload({
      groups: [{
        groupKey: 'honda\u001fwave\u001fs',
        costPrice: 999,
        saleMode: 'manual',
        manualSellPrice: 1200,
      }],
    })

    previewedPayload.groups[0].costPrice = 777

    expect(accepted).not.toBeNull()
    expect(valuationClosePayload(accepted!, true)).toEqual({
      ...requestPayload(),
      replaceExisting: true,
    })
    expect(valuationClosePayload(accepted!, true)).not.toEqual({
      ...laterPayload,
      replaceExisting: true,
    })
  })

  it('clears an accepted preview when re-preview starts and leaves it cleared after STALE_STOCK', () => {
    const payload = requestPayload()
    const first = beginValuationPreview(createValuationLifecycle(), payload)
    const accepted = acceptValuationPreview(first.lifecycle, first.request, payload, projection(payload))
    expect(accepted.preview).not.toBeNull()
    expect(isValuationPreviewReady(accepted.lifecycle, accepted.preview, payload)).toBe(true)

    const retry = beginValuationPreview(accepted.lifecycle, payload)
    expect(isValuationPreviewReady(retry.lifecycle, accepted.preview, payload)).toBe(false)

    const failed = failValuationPreview(retry.lifecycle, retry.request)
    expect(isValuationPreviewReady(failed, accepted.preview, payload)).toBe(false)
  })

  it('does not let a late failure from request A clear accepted preview B', () => {
    const payload = requestPayload()
    const first = beginValuationPreview(createValuationLifecycle(), payload)
    const second = beginValuationPreview(first.lifecycle, payload)
    const accepted = acceptValuationPreview(
      second.lifecycle,
      second.request,
      payload,
      projection(payload),
    )

    const afterLateFailure = failValuationPreview(accepted.lifecycle, first.request)
    expect(isValuationPreviewReady(afterLateFailure, accepted.preview, payload)).toBe(true)
  })
})

describe('stock valuation data synchronization', () => {
  const synchronized = {
    period: '2026-08',
    currentPeriod: '2026-08',
    currentStockFingerprint: 'stock-a',
    draftSource: valuationSource('2026-08', 'stock-a'),
    draftGroupCount: 1,
    hasFatalError: false,
    isFetching: false,
  }

  it.each([
    ['before current data loads', { currentPeriod: null, currentStockFingerprint: null }],
    ['after a fatal current-data error', { hasFatalError: true }],
    ['when the loaded data belongs to another period', { currentPeriod: '2026-07' }],
    ['with an unsynchronized draft', { draftSource: valuationSource('2026-08', 'stock-old') }],
    ['with zero draft groups', { draftGroupCount: 0 }],
    ['while current stock is fetching', { isFetching: true }],
  ])('blocks preview %s', (_case, overrides) => {
    expect(valuationPreviewBlockReason({ ...synchronized, ...overrides })).not.toBeNull()
  })

  it('allows preview only for loaded, synchronized, non-empty current data', () => {
    expect(valuationPreviewBlockReason(synchronized)).toBeNull()
  })

  it('does not adopt a changed background source over dirty values or during explicit refresh', () => {
    const current = valuationSource('2026-08', 'stock-a')
    const changed = valuationSource('2026-08', 'stock-b')

    expect(shouldAdoptValuationSource({ activePeriod: '2026-08', draftSource: '', nextSource: current, isDirty: true, explicitRefreshInFlight: false })).toBe(true)
    expect(shouldAdoptValuationSource({ activePeriod: '2026-08', draftSource: current, nextSource: changed, isDirty: true, explicitRefreshInFlight: false })).toBe(false)
    expect(shouldAdoptValuationSource({ activePeriod: '2026-08', draftSource: current, nextSource: changed, isDirty: false, explicitRefreshInFlight: true })).toBe(false)
    expect(shouldAdoptValuationSource({ activePeriod: '2026-08', draftSource: current, nextSource: changed, isDirty: false, explicitRefreshInFlight: false })).toBe(true)
    expect(shouldAdoptValuationSource({ activePeriod: '2026-09', draftSource: current, nextSource: valuationSource('2026-09', 'stock-c'), isDirty: true, explicitRefreshInFlight: false })).toBe(true)
    expect(shouldAdoptValuationSource({ activePeriod: '2026-09', draftSource: current, nextSource: changed, isDirty: false, explicitRefreshInFlight: false })).toBe(false)
  })

  it.each(['edit', 'reset', 'period change'])('rejects an explicit refresh after a later %s', () => {
    const lifecycle = createValuationLifecycle()
    const refresh = valuationRefreshToken(lifecycle, '2026-08')

    expect(valuationRefreshCanApply(lifecycle, refresh, '2026-08')).toBe(true)
    expect(valuationRefreshCanApply(invalidateValuationDraft(lifecycle), refresh, '2026-08')).toBe(false)
    expect(valuationRefreshCanApply(lifecycle, refresh, '2026-09')).toBe(false)
  })
})
