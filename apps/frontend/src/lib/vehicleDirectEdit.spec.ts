import { directEditAction, directEditFailurePlan, directEditReturnTo } from './vehicleDirectEdit'

describe('directEditAction', () => {
  const vehicle = { id: 42, internalCode: 'SM-042' }

  it('opens a requested positive id only for an admin after its fetch settles successfully', () => {
    expect(directEditAction({ isAdmin: true, requestedId: 42, vehicle, isFetching: true, isError: false, isRefetchError: false, handledId: null })).toBe('none')
    expect(directEditAction({ isAdmin: false, requestedId: 42, vehicle, isFetching: false, isError: false, isRefetchError: false, handledId: null })).toBe('none')
    expect(directEditAction({ isAdmin: true, requestedId: 0, vehicle, isFetching: false, isError: false, isRefetchError: false, handledId: null })).toBe('none')
    expect(directEditAction({ isAdmin: true, requestedId: 42, vehicle, isFetching: false, isError: false, isRefetchError: false, handledId: null })).toBe('open')
  })

  it('gives a settled cached-data refetch failure precedence over opening', () => {
    expect(directEditAction({ isAdmin: true, requestedId: 42, vehicle, isFetching: false, isError: false, isRefetchError: true, handledId: null })).toBe('error')
    expect(directEditAction({ isAdmin: true, requestedId: 42, vehicle, isFetching: false, isError: false, isRefetchError: true, handledId: 42 })).toBe('none')
  })

  it('handles each requested id once', () => {
    expect(directEditAction({ isAdmin: true, requestedId: 42, vehicle, isFetching: false, isError: false, isRefetchError: false, handledId: 42 })).toBe('none')
  })
})

describe('directEditFailurePlan', () => {
  it('plans one toast, fallback search, and clean replacement after a settled fetch failure', () => {
    expect(directEditFailurePlan('SM-042')).toEqual({
      message: 'No se pudo abrir la moto solicitada',
      search: 'SM-042',
      replaceTo: '/vehicles',
    })
  })
})

describe('directEditReturnTo', () => {
  it('returns only a validated valuation path for cancel and save', () => {
    expect(directEditReturnTo('/stock-valuation?period=2026-08')).toBe('/stock-valuation?period=2026-08')
    expect(directEditReturnTo('https://evil.example')).toBeNull()
  })

  it('does not navigate for grid-origin edits without returnTo', () => {
    expect(directEditReturnTo(null)).toBeNull()
  })
})
