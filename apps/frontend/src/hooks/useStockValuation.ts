import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { createValuationDraft, toValuationGroups, valuationDraftChanged } from '../lib/stockValuation'
import {
  acceptValuationPreview,
  beginValuationPreview,
  createValuationLifecycle,
  failValuationPreview,
  invalidateValuationDraft,
  isValuationPreviewReady,
  shouldAdoptValuationSource,
  valuationClosePayload,
  valuationPreviewBlockReason,
  valuationRefreshCanApply,
  valuationRefreshToken,
  valuationSource,
  type AcceptedValuationPreview,
  type ValuationPreviewRequest,
  type ValuationRefreshToken,
} from '../lib/stockValuationLifecycle'
import type {
  CurrentValuationResponse,
  DraftGroup,
  StockValuationDetail,
  StockValuationHeader,
  ValuationGroup,
  ValuationProjection,
  ValuationRequestPayload,
} from '../types/stock-valuation.types'

export type StockRefreshResult = 'updated' | 'preserved'

const requestPayload = (
  period: string,
  current: CurrentValuationResponse | undefined,
  draft: DraftGroup[],
  generalMargin: string,
): ValuationRequestPayload => ({
  period,
  stockFingerprint: current?.stockFingerprint ?? '',
  ...(generalMargin.trim() === ''
    ? {}
    : { generalMarginPercent: Number(generalMargin) }),
  groups: toValuationGroups(draft),
})

export function useStockValuation(period: string, enabled = true) {
  const queryClient = useQueryClient()
  const [draft, setDraftState] = useState<DraftGroup[]>([])
  const [draftBaseline, setDraftBaseline] = useState<ValuationGroup[]>([])
  const [generalMargin, setGeneralMarginState] = useState('')
  const [acceptedPreview, setAcceptedPreviewState] = useState<AcceptedValuationPreview | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)
  const [draftSource, setDraftSourceState] = useState('')
  const [lifecycle, setLifecycleState] = useState(createValuationLifecycle)
  const [renderPeriod, setRenderPeriod] = useState(period)

  const lifecycleRef = useRef(lifecycle)
  const acceptedPreviewRef = useRef<AcceptedValuationPreview | null>(null)
  const explicitRefreshRef = useRef<ValuationRefreshToken | null>(null)
  const periodRef = useRef(period)
  const draftRef = useRef(draft)
  const generalMarginRef = useRef(generalMargin)
  const draftSourceRef = useRef(draftSource)

  if (renderPeriod !== period) {
    setRenderPeriod(period)
    setLifecycleState((current) => invalidateValuationDraft(current))
    setAcceptedPreviewState(null)
  }

  const currentQuery = useQuery<CurrentValuationResponse>({
    queryKey: ['stock-valuations', 'current', period],
    queryFn: () => api.get('/stock-valuations/preview', { params: { period } }).then((response) => response.data),
    enabled: enabled && Boolean(period),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const currentDataRef = useRef<CurrentValuationResponse | undefined>(currentQuery.data)

  const commitLifecycle = useCallback((next: ReturnType<typeof createValuationLifecycle>) => {
    lifecycleRef.current = next
    setLifecycleState(next)
  }, [])

  useLayoutEffect(() => {
    if (periodRef.current === period) return
    periodRef.current = period
    lifecycleRef.current = invalidateValuationDraft(lifecycleRef.current)
    acceptedPreviewRef.current = null
    explicitRefreshRef.current = null
  }, [period])

  useLayoutEffect(() => {
    currentDataRef.current = currentQuery.data
  }, [currentQuery.data])

  const historyQuery = useQuery<StockValuationHeader[]>({
    queryKey: ['stock-valuations', 'history'],
    queryFn: () => api.get('/stock-valuations').then((response) => response.data),
    enabled,
  })

  const detailQuery = useQuery<StockValuationDetail>({
    queryKey: ['stock-valuations', 'detail', selectedHistoryId],
    queryFn: () => api.get(`/stock-valuations/${selectedHistoryId}`).then((response) => response.data),
    enabled: enabled && selectedHistoryId !== null,
  })

  const isDirty = valuationDraftChanged(draft, generalMargin, draftBaseline)

  useEffect(() => {
    const current = currentQuery.data
    if (!current) return
    const nextSource = valuationSource(current.period, current.stockFingerprint)
    if (!shouldAdoptValuationSource({
      activePeriod: period,
      draftSource,
      nextSource,
      isDirty,
      explicitRefreshInFlight: explicitRefreshRef.current !== null,
    })) return

    const nextDraft = createValuationDraft(current.groups)
    draftRef.current = nextDraft
    generalMarginRef.current = ''
    draftSourceRef.current = nextSource
    setDraftState(nextDraft)
    setDraftBaseline(current.groups)
    setGeneralMarginState('')
    setDraftSourceState(nextSource)
    commitLifecycle(invalidateValuationDraft(lifecycleRef.current))
    acceptedPreviewRef.current = null
    setAcceptedPreviewState(null)
  }, [commitLifecycle, currentQuery.data, draftSource, isDirty, period])

  const payload = (): ValuationRequestPayload => requestPayload(
    periodRef.current,
    currentDataRef.current,
    draftRef.current,
    generalMarginRef.current,
  )

  const blockReason = () => valuationPreviewBlockReason({
    period: periodRef.current,
    currentPeriod: currentDataRef.current?.period ?? null,
    currentStockFingerprint: currentDataRef.current?.stockFingerprint ?? null,
    draftSource: draftSourceRef.current,
    draftGroupCount: draftRef.current.length,
    hasFatalError: currentQuery.isError && !currentDataRef.current,
    isFetching: currentQuery.isFetching || explicitRefreshRef.current !== null,
  })

  const previewMutation = useMutation<ValuationProjection, unknown, ValuationPreviewRequest>({
    mutationFn: (request) => api.post('/stock-valuations/preview', request.payload).then((response) => response.data),
    onSuccess: (projection, request) => {
      const accepted = acceptValuationPreview(
        lifecycleRef.current,
        request,
        payload(),
        projection,
      )
      commitLifecycle(accepted.lifecycle)
      if (!accepted.preview) return
      acceptedPreviewRef.current = accepted.preview
      setAcceptedPreviewState(accepted.preview)
    },
    onError: (_error, request) => {
      const previous = lifecycleRef.current
      const next = failValuationPreview(previous, request)
      if (next === previous) return
      commitLifecycle(next)
      acceptedPreviewRef.current = null
      setAcceptedPreviewState(null)
      const response = (_error as { response?: { status?: number; data?: { code?: string } } })?.response
      if (response?.status === 409 && response.data?.code === 'STALE_STOCK')
        void queryClient.invalidateQueries({ queryKey: ['stock-valuations', 'current', periodRef.current] })
    },
  })

  const closeMutation = useMutation<
    StockValuationDetail,
    unknown,
    { preview: AcceptedValuationPreview; replaceExisting: boolean }
  >({
    mutationFn: ({ preview, replaceExisting }) => api.post(
      '/stock-valuations/close',
      valuationClosePayload(preview, replaceExisting),
    ).then((response) => response.data),
    onSuccess: async () => {
      commitLifecycle(invalidateValuationDraft(lifecycleRef.current))
      acceptedPreviewRef.current = null
      setAcceptedPreviewState(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-valuations'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ])
      draftSourceRef.current = ''
      setDraftSourceState('')
    },
  })

  const setDraft = (next: DraftGroup[] | ((current: DraftGroup[]) => DraftGroup[])) => {
    const resolved = typeof next === 'function' ? next(draftRef.current) : next
    draftRef.current = resolved
    setDraftState(resolved)
    commitLifecycle(invalidateValuationDraft(lifecycleRef.current))
    acceptedPreviewRef.current = null
    setAcceptedPreviewState(null)
  }

  const setGeneralMargin = (value: string) => {
    generalMarginRef.current = value
    setGeneralMarginState(value)
    commitLifecycle(invalidateValuationDraft(lifecycleRef.current))
    acceptedPreviewRef.current = null
    setAcceptedPreviewState(null)
  }

  const resetDraft = () => {
    const current = currentDataRef.current
    const nextDraft = createValuationDraft(current?.groups ?? [])
    const nextSource = current ? valuationSource(current.period, current.stockFingerprint) : ''
    draftRef.current = nextDraft
    generalMarginRef.current = ''
    draftSourceRef.current = nextSource
    setDraftState(nextDraft)
    setDraftBaseline(current?.groups ?? [])
    setGeneralMarginState('')
    setDraftSourceState(nextSource)
    commitLifecycle(invalidateValuationDraft(lifecycleRef.current))
    acceptedPreviewRef.current = null
    setAcceptedPreviewState(null)
  }

  const requestPreview = (): Promise<ValuationProjection> => {
    const reason = blockReason()
    if (reason) return Promise.reject(new Error(reason))
    const started = beginValuationPreview(lifecycleRef.current, payload())
    commitLifecycle(started.lifecycle)
    acceptedPreviewRef.current = null
    setAcceptedPreviewState(null)
    return previewMutation.mutateAsync(started.request)
  }

  const close = (replaceExisting = false): Promise<StockValuationDetail> => {
    const currentPreview = acceptedPreviewRef.current
    const reason = blockReason()
    if (reason || !isValuationPreviewReady(lifecycleRef.current, currentPreview, payload()))
      return Promise.reject(new Error(reason ?? 'La previsualización ya no está vigente.'))
    return closeMutation.mutateAsync({ preview: currentPreview!, replaceExisting })
  }

  const refreshStock = async (): Promise<StockRefreshResult> => {
    commitLifecycle(invalidateValuationDraft(lifecycleRef.current))
    acceptedPreviewRef.current = null
    setAcceptedPreviewState(null)
    const token = valuationRefreshToken(lifecycleRef.current, periodRef.current)
    explicitRefreshRef.current = token

    try {
      const result = await currentQuery.refetch({ throwOnError: true })
      if (!result.data) throw new Error('No se recibió el stock actualizado')
      if (explicitRefreshRef.current !== token || !valuationRefreshCanApply(lifecycleRef.current, token, periodRef.current))
        return 'preserved'

      const nextDraft = createValuationDraft(result.data.groups)
      const nextSource = valuationSource(result.data.period, result.data.stockFingerprint)
      draftRef.current = nextDraft
      generalMarginRef.current = ''
      draftSourceRef.current = nextSource
      setDraftState(nextDraft)
      setDraftBaseline(result.data.groups)
      setGeneralMarginState('')
      setDraftSourceState(nextSource)
      commitLifecycle(invalidateValuationDraft(lifecycleRef.current))
      return 'updated'
    } finally {
      if (explicitRefreshRef.current === token) explicitRefreshRef.current = null
    }
  }

  const renderedPayload = requestPayload(period, currentQuery.data, draft, generalMargin)
  const previewBlockReason = valuationPreviewBlockReason({
    period,
    currentPeriod: currentQuery.data?.period ?? null,
    currentStockFingerprint: currentQuery.data?.stockFingerprint ?? null,
    draftSource,
    draftGroupCount: draft.length,
    hasFatalError: currentQuery.isError && !currentQuery.data,
    isFetching: currentQuery.isFetching,
  })
  const previewReady = previewBlockReason === null
    && isValuationPreviewReady(lifecycle, acceptedPreview, renderedPayload)

  return {
    current: currentQuery.data,
    currentQuery,
    history: historyQuery.data ?? [],
    historyQuery,
    detail: detailQuery.data,
    detailQuery,
    draft,
    setDraft,
    generalMargin,
    setGeneralMargin,
    preview: previewReady ? acceptedPreview?.projection ?? null : null,
    previewReady,
    previewBlockReason,
    requestPreview,
    previewMutation,
    close,
    closeMutation,
    selectHistory: setSelectedHistoryId,
    selectedHistoryId,
    resetDraft,
    isDirty,
    refreshStock,
  }
}
