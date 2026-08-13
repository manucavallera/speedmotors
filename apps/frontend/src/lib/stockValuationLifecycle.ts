import type { ValuationProjection, ValuationRequestPayload } from '../types/stock-valuation.types'

export interface ValuationLifecycle {
  revision: number
  nextPreviewRequestId: number
  activePreviewRequestId: number | null
  acceptedPreviewRequestId: number | null
}

export interface ValuationPreviewRequest {
  id: number
  revision: number
  signature: string
  payload: ValuationRequestPayload
}

export interface AcceptedValuationPreview {
  request: ValuationPreviewRequest
  projection: ValuationProjection
}

export interface ValuationRefreshToken {
  revision: number
  period: string
}

interface PreviewAvailability {
  period: string
  currentPeriod: string | null
  currentStockFingerprint: string | null
  draftSource: string
  draftGroupCount: number
  hasFatalError: boolean
  isFetching: boolean
}

interface SourceAdoption {
  activePeriod: string
  draftSource: string
  nextSource: string
  isDirty: boolean
  explicitRefreshInFlight: boolean
}

const snapshotPayload = (payload: ValuationRequestPayload): ValuationRequestPayload => ({
  period: payload.period,
  stockFingerprint: payload.stockFingerprint,
  ...(payload.generalMarginPercent === undefined
    ? {}
    : { generalMarginPercent: payload.generalMarginPercent }),
  groups: payload.groups.map((group) => ({ ...group })),
})

const requestSignature = (payload: ValuationRequestPayload): string =>
  JSON.stringify(snapshotPayload(payload))

const sourcePeriod = (source: string): string => source.slice(0, 7)

export function createValuationLifecycle(): ValuationLifecycle {
  return {
    revision: 0,
    nextPreviewRequestId: 1,
    activePreviewRequestId: null,
    acceptedPreviewRequestId: null,
  }
}

export function invalidateValuationDraft(lifecycle: ValuationLifecycle): ValuationLifecycle {
  return {
    ...lifecycle,
    revision: lifecycle.revision + 1,
    activePreviewRequestId: null,
    acceptedPreviewRequestId: null,
  }
}

export function beginValuationPreview(
  lifecycle: ValuationLifecycle,
  payload: ValuationRequestPayload,
): { lifecycle: ValuationLifecycle; request: ValuationPreviewRequest } {
  const snapshot = snapshotPayload(payload)
  const request: ValuationPreviewRequest = {
    id: lifecycle.nextPreviewRequestId,
    revision: lifecycle.revision,
    signature: requestSignature(snapshot),
    payload: snapshot,
  }

  return {
    lifecycle: {
      ...lifecycle,
      nextPreviewRequestId: request.id + 1,
      activePreviewRequestId: request.id,
      acceptedPreviewRequestId: null,
    },
    request,
  }
}

export function isValuationPreviewRequestLatest(
  lifecycle: ValuationLifecycle,
  request: ValuationPreviewRequest,
): boolean {
  return lifecycle.revision === request.revision
    && lifecycle.activePreviewRequestId === request.id
}

export function isValuationPreviewRequestCurrent(
  lifecycle: ValuationLifecycle,
  request: ValuationPreviewRequest,
  currentPayload: ValuationRequestPayload,
): boolean {
  return isValuationPreviewRequestLatest(lifecycle, request)
    && request.signature === requestSignature(currentPayload)
}

export function acceptValuationPreview(
  lifecycle: ValuationLifecycle,
  request: ValuationPreviewRequest,
  currentPayload: ValuationRequestPayload,
  projection: ValuationProjection,
): { lifecycle: ValuationLifecycle; preview: AcceptedValuationPreview | null } {
  const responseMatchesRequest = projection.period === request.payload.period
    && projection.stockFingerprint === request.payload.stockFingerprint
  if (!responseMatchesRequest || !isValuationPreviewRequestCurrent(lifecycle, request, currentPayload)) {
    return {
      lifecycle: isValuationPreviewRequestLatest(lifecycle, request)
        ? failValuationPreview(lifecycle, request)
        : lifecycle,
      preview: null,
    }
  }

  return {
    lifecycle: {
      ...lifecycle,
      activePreviewRequestId: null,
      acceptedPreviewRequestId: request.id,
    },
    preview: { request, projection },
  }
}

export function failValuationPreview(
  lifecycle: ValuationLifecycle,
  request: ValuationPreviewRequest,
): ValuationLifecycle {
  if (!isValuationPreviewRequestLatest(lifecycle, request)) return lifecycle
  return {
    ...lifecycle,
    activePreviewRequestId: null,
    acceptedPreviewRequestId: null,
  }
}

export function isValuationPreviewReady(
  lifecycle: ValuationLifecycle,
  preview: AcceptedValuationPreview | null,
  currentPayload: ValuationRequestPayload,
): boolean {
  return preview !== null
    && lifecycle.revision === preview.request.revision
    && lifecycle.acceptedPreviewRequestId === preview.request.id
    && preview.request.signature === requestSignature(currentPayload)
}

export function valuationClosePayload(
  preview: AcceptedValuationPreview,
  replaceExisting = false,
): ValuationRequestPayload {
  return {
    ...snapshotPayload(preview.request.payload),
    ...(replaceExisting ? { replaceExisting: true } : {}),
  }
}

export function valuationSource(period: string, stockFingerprint: string): string {
  return `${period}:${stockFingerprint}`
}

export function valuationPreviewBlockReason({
  period,
  currentPeriod,
  currentStockFingerprint,
  draftSource,
  draftGroupCount,
  hasFatalError,
  isFetching,
}: PreviewAvailability): string | null {
  if (hasFatalError || currentPeriod === null || currentStockFingerprint === null)
    return 'Esperá a que el stock actual se cargue correctamente.'
  if (currentPeriod !== period)
    return 'El stock cargado no corresponde al período seleccionado.'
  if (isFetching)
    return 'Esperá a que termine la actualización del stock.'
  if (draftGroupCount === 0)
    return 'No hay motos disponibles o reservadas para previsualizar.'
  if (draftSource !== valuationSource(currentPeriod, currentStockFingerprint))
    return 'El stock cambió. Actualizalo para sincronizar el borrador antes de previsualizar.'
  return null
}

export function shouldAdoptValuationSource({
  activePeriod,
  draftSource,
  nextSource,
  isDirty,
  explicitRefreshInFlight,
}: SourceAdoption): boolean {
  if (sourcePeriod(nextSource) !== activePeriod) return false
  if (draftSource === nextSource) return false
  if (draftSource === '' || sourcePeriod(draftSource) !== activePeriod) return true
  if (explicitRefreshInFlight || isDirty) return false
  return true
}

export function valuationRefreshToken(
  lifecycle: ValuationLifecycle,
  period: string,
): ValuationRefreshToken {
  return { revision: lifecycle.revision, period }
}

export function valuationRefreshCanApply(
  lifecycle: ValuationLifecycle,
  token: ValuationRefreshToken,
  activePeriod: string,
): boolean {
  return lifecycle.revision === token.revision && token.period === activePeriod
}
