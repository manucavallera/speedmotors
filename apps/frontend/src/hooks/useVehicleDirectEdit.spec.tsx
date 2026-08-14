import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import type { Vehicle } from '../types/api.types'
import { useVehicleDirectEdit } from './useVehicleDirectEdit'

const vehicle: Vehicle = {
  id: 42,
  type: 'moto',
  brand: 'Honda',
  model: 'Wave',
  displacement: 110,
  version: 'S',
  year: 2024,
  color: 'Rojo',
  chassisNumber: 'CH-42',
  engineNumber: 'EN-42',
  internalCode: 'SM-042',
  importCode: null,
  status: 'disponible',
  sellPrice: '1250000',
  costPrice: '1000000',
  notes: null,
  photoUrl: null,
  createdAt: '2026-08-14T00:00:00.000Z',
  updatedAt: null,
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function createWrapper(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          {children}
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('useVehicleDirectEdit', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    toast._unsubscribe()
  })

  it('opens the typed requested vehicle once and exposes its safe valuation return path', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: vehicle } as never)
    const onOpen = jest.fn<(selected: Vehicle) => void>()

    const { result } = renderHook(
      () => useVehicleDirectEdit({ isAdmin: true, onOpen, onFallbackSearch: () => undefined }),
      { wrapper: createWrapper('/vehicles?edit=42&returnTo=%2Fstock-valuation%3Fperiod%3D2026-08') },
    )

    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(vehicle))

    expect(get).toHaveBeenCalledWith('/vehicles/42')
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(result.current.returnTo).toBe('/stock-valuation?period=2026-08')
  })

  it('falls back to the supplied search, toasts, and cleans the URL when the detail fetch fails', async () => {
    jest.spyOn(api, 'get').mockRejectedValue(new Error('missing'))
    const onFallbackSearch = jest.fn<(search: string) => void>()
    const toastListener = jest.fn<(message: string, type: 'error' | 'success' | 'info') => void>()
    toast._subscribe(toastListener)

    renderHook(
      () => useVehicleDirectEdit({ isAdmin: true, onOpen: () => undefined, onFallbackSearch }),
      { wrapper: createWrapper('/vehicles?edit=42&search=SM-042') },
    )

    await waitFor(() => expect(onFallbackSearch).toHaveBeenCalledWith('SM-042'))

    expect(toastListener).toHaveBeenCalledWith('No se pudo abrir la moto solicitada', 'error')
    expect(screen.getByTestId('location').textContent).toBe('/vehicles')
  })

  it('does not request details for non-admin or invalid direct-edit ids', () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: vehicle } as never)

    const nonAdmin = renderHook(
      () => useVehicleDirectEdit({ isAdmin: false, onOpen: () => undefined, onFallbackSearch: () => undefined }),
      { wrapper: createWrapper('/vehicles?edit=42') },
    )
    nonAdmin.unmount()

    renderHook(
      () => useVehicleDirectEdit({ isAdmin: true, onOpen: () => undefined, onFallbackSearch: () => undefined }),
      { wrapper: createWrapper('/vehicles?edit=not-a-number') },
    )

    expect(get).not.toHaveBeenCalled()
  })
})
