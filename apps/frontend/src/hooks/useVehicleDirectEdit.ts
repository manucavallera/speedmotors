import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { directEditAction, directEditFailurePlan, directEditReturnTo } from '../lib/vehicleDirectEdit'
import type { Vehicle } from '../types/api.types'

interface UseVehicleDirectEditOptions {
  isAdmin: boolean
  onOpen: (vehicle: Vehicle) => void
  onFallbackSearch: (search: string) => void
}

interface UseVehicleDirectEditResult {
  returnTo: string | null
}

export function useVehicleDirectEdit({
  isAdmin,
  onOpen,
  onFallbackSearch,
}: UseVehicleDirectEditOptions): UseVehicleDirectEditResult {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedEditId = Number(searchParams.get('edit'))
  const fallbackSearch = searchParams.get('search') ?? ''
  const returnTo = directEditReturnTo(searchParams.get('returnTo'))
  const hasDirectEdit = Number.isInteger(requestedEditId) && requestedEditId > 0
  const handledDirectId = useRef<number | null>(null)

  const {
    data: directVehicle,
    isError: isDirectVehicleError,
    isFetching: isDirectVehicleFetching,
    isRefetchError: isDirectVehicleRefetchError,
  } = useQuery<Vehicle>({
    queryKey: ['vehicles', 'detail', requestedEditId],
    queryFn: () => api.get<Vehicle>(`/vehicles/${requestedEditId}`).then(({ data }) => data),
    enabled: isAdmin && hasDirectEdit,
  })

  useEffect(() => {
    const directAction = directEditAction({
      isAdmin,
      requestedId: requestedEditId,
      vehicle: directVehicle,
      isFetching: isDirectVehicleFetching,
      isError: isDirectVehicleError,
      isRefetchError: isDirectVehicleRefetchError,
      handledId: handledDirectId.current,
    })

    if (directAction === 'open' && directVehicle) {
      handledDirectId.current = requestedEditId
      onOpen(directVehicle)
      return
    }
    if (directAction !== 'error') return
    const failure = directEditFailurePlan(fallbackSearch)
    handledDirectId.current = requestedEditId
    toast.error(failure.message)
    onFallbackSearch(failure.search)
    navigate(failure.replaceTo, { replace: true })
  }, [
    directVehicle,
    fallbackSearch,
    isAdmin,
    isDirectVehicleError,
    isDirectVehicleFetching,
    isDirectVehicleRefetchError,
    navigate,
    onFallbackSearch,
    onOpen,
    requestedEditId,
  ])

  return { returnTo }
}
