import { safeValuationReturnTo } from './stockValuation'

export type DirectEditAction = 'none' | 'open' | 'error'

interface DirectEditState {
  isAdmin: boolean
  requestedId: number
  vehicle: unknown
  isFetching: boolean
  isError: boolean
  isRefetchError: boolean
  handledId: number | null
}

export function directEditAction({
  isAdmin,
  requestedId,
  vehicle,
  isFetching,
  isError,
  isRefetchError,
  handledId,
}: DirectEditState): DirectEditAction {
  const hasDirectEdit = Number.isInteger(requestedId) && requestedId > 0
  if (!isAdmin || !hasDirectEdit || handledId === requestedId || isFetching) return 'none'
  if (isError || isRefetchError) return 'error'
  return vehicle ? 'open' : 'none'
}

export function directEditFailurePlan(search: string) {
  return {
    message: 'No se pudo abrir la moto solicitada',
    search,
    replaceTo: '/vehicles',
  }
}

export function directEditReturnTo(value: string | null): string | null {
  return safeValuationReturnTo(value)
}
