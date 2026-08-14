import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import { useCredits } from '../hooks/useCredits'
import { CreditsPage } from './CreditsPage'

jest.mock('../hooks/useCredits', () => ({ useCredits: jest.fn() }))
jest.mock('../hooks/useAuth', () => ({ useAuth: () => ({ isAdmin: false }) }))

const mockedUseCredits = useCredits as jest.MockedFunction<typeof useCredits>

describe('CreditsPage', () => {
  it('preserves filters and offers retry after a list error', () => {
    const refetch = jest.fn()
    mockedUseCredits.mockReturnValue({
      credits: [],
      clients: [],
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('network error'),
      refetch,
      modal: false,
      setModal: jest.fn(),
      editing: null,
      setEditing: jest.fn(),
      detailId: null,
      setDetailId: jest.fn(),
      detail: undefined,
      detailLoading: false,
      statusFilter: 'activo',
      setStatusFilter: jest.fn(),
      search: 'Gómez',
      setSearch: jest.fn(),
      debtTypeFilter: 'libre',
      setDebtTypeFilter: jest.fn(),
      page: 1,
      setPage: jest.fn(),
      total: 0,
      pages: 0,
    } as unknown as ReturnType<typeof useCredits>)

    render(<CreditsPage />)

    expect((screen.getByLabelText('Buscar cliente') as HTMLInputElement).value).toBe('Gómez')
    expect((screen.getByLabelText('Tipo de deuda') as HTMLSelectElement).value).toBe('libre')
    expect(screen.getByRole('alert')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
