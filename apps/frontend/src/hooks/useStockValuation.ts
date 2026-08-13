import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { createValuationDraft, toValuationGroups } from '../lib/stockValuation'
import type {
  CurrentValuationResponse,
  DraftGroup,
  StockValuationDetail,
  StockValuationHeader,
  ValuationProjection,
  ValuationRequestPayload,
} from '../types/stock-valuation.types'

export function useStockValuation(period: string, enabled = true) {
  const queryClient = useQueryClient()
  const [draft, setDraftState] = useState<DraftGroup[]>([])
  const [generalMargin, setGeneralMarginState] = useState('')
  const [preview, setPreview] = useState<ValuationProjection | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)
  const [draftSource, setDraftSource] = useState('')

  const currentQuery = useQuery<CurrentValuationResponse>({
    queryKey: ['stock-valuations', 'current', period],
    queryFn: () => api.get('/stock-valuations/preview', { params: { period } }).then((response) => response.data),
    enabled: enabled && Boolean(period),
  })

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

  useEffect(() => {
    if (!currentQuery.data) return
    const source = `${currentQuery.data.period}:${currentQuery.data.stockFingerprint}`
    if (source === draftSource) return
    setDraftState(createValuationDraft(currentQuery.data.groups))
    setGeneralMarginState('')
    setPreview(null)
    setDraftSource(source)
  }, [currentQuery.data, draftSource])

  const payload = (): ValuationRequestPayload => ({
    period,
    stockFingerprint: currentQuery.data?.stockFingerprint ?? '',
    ...(generalMargin.trim() === '' ? {} : { generalMarginPercent: Number(generalMargin) }),
    groups: toValuationGroups(draft),
  })

  const previewMutation = useMutation<ValuationProjection>({
    mutationFn: () => api.post('/stock-valuations/preview', payload()).then((response) => response.data),
    onSuccess: setPreview,
  })

  const closeMutation = useMutation<StockValuationDetail, unknown, boolean | undefined>({
    mutationFn: (replaceExisting) => api.post('/stock-valuations/close', {
      ...payload(),
      ...(replaceExisting ? { replaceExisting: true } : {}),
    }).then((response) => response.data),
    onSuccess: async () => {
      setPreview(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-valuations'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ])
    },
  })

  const setDraft = (next: DraftGroup[] | ((current: DraftGroup[]) => DraftGroup[])) => {
    setDraftState(next)
    setPreview(null)
  }

  const setGeneralMargin = (value: string) => {
    setGeneralMarginState(value)
    setPreview(null)
  }

  const resetDraft = () => {
    setDraftState(createValuationDraft(currentQuery.data?.groups ?? []))
    setGeneralMarginState('')
    setPreview(null)
  }

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
    preview,
    previewMutation,
    close: (replaceExisting?: boolean) => closeMutation.mutateAsync(replaceExisting),
    closeMutation,
    selectHistory: setSelectedHistoryId,
    selectedHistoryId,
    resetDraft,
  }
}
