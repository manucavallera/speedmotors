import { db } from '../db'
import { credits } from '../db/schema'
import { CreditsService } from './credits.service'

jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('CreditsService interest charges', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('repairs an old charge created before the configured due date', async () => {
    const service = new CreditsService()
    const startDate = new Date('2026-08-21T12:00:00.000Z')
    const firstDueDate = new Date('2026-10-10T12:00:00.000Z')
    const credit = {
      id: 1,
      clientId: 10,
      userId: 20,
      saleId: null,
      creditType: 'saldo_compuesto' as const,
      currency: 'pesos' as const,
      originalAmount: '1000000.00',
      interestRate: '3.00',
      startDate,
      firstDueDate,
      installmentsCount: null,
      status: 'activo' as const,
      notes: null,
      createdAt: startDate,
      updatedAt: startDate,
    } satisfies typeof credits.$inferSelect

    const selectMock = jest.mocked(db.select)
    const insertMock = jest.mocked(db.insert)
    const deleteMock = jest.mocked(db.delete)
    const valuesMock = jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) })
    const deleteWhereMock = jest.fn().mockResolvedValue([])

    selectMock.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([credit]) }),
    } as never)
    selectMock.mockReturnValueOnce({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve([{
        id: 1,
        creditId: credit.id,
        chargeDate: startDate,
        balanceBefore: '1910.00',
        amount: '57.30',
      }]) }) }),
    } as never)
    insertMock.mockReturnValue({ values: valuesMock } as never)
    deleteMock.mockReturnValue({ where: deleteWhereMock } as never)

    jest.useFakeTimers().setSystemTime(new Date('2026-09-15T12:00:00.000Z'))

    await service.applyPendingInterest(credit.id)

    expect(deleteMock).toHaveBeenCalled()
    expect(deleteWhereMock).toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('charges October interest on the post-payment balance at the October due date', async () => {
    const service = new CreditsService()
    const startDate = new Date('2026-08-21T12:00:00.000Z')
    const firstDueDate = new Date('2026-10-10T12:00:00.000Z')
    const credit = {
      id: 1,
      clientId: 10,
      userId: 20,
      saleId: null,
      creditType: 'saldo_compuesto' as const,
      currency: 'pesos' as const,
      originalAmount: '1910.00',
      interestRate: '3.00',
      startDate,
      firstDueDate,
      installmentsCount: null,
      status: 'activo' as const,
      notes: null,
      createdAt: startDate,
      updatedAt: startDate,
    } satisfies typeof credits.$inferSelect

    const selectMock = jest.mocked(db.select)
    const insertMock = jest.mocked(db.insert)
    const valuesMock = jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) })

    selectMock.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([credit]) }),
    } as never)
    selectMock.mockReturnValueOnce({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve([]) }) }),
    } as never)
    insertMock.mockReturnValue({ values: valuesMock } as never)

    jest.useFakeTimers().setSystemTime(new Date('2026-10-11T12:00:00.000Z'))
    jest.spyOn(service as unknown as { computeBalanceAt: () => Promise<number> }, 'computeBalanceAt')
      .mockResolvedValue(1510)

    await service.applyPendingInterest(credit.id)

    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
      creditId: credit.id,
      chargeDate: firstDueDate,
      balanceBefore: '1510.00',
      amount: '45.30',
    }))
  })
})
