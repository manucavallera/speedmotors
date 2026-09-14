import { db } from '../db'
import { credits } from '../db/schema'
import { CreditsService } from './credits.service'

jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}))

describe('CreditsService interest charges', () => {
  it('charges the first due month over the balance after the prior payment', async () => {
    const service = new CreditsService()
    const startDate = new Date('2025-08-21T12:00:00.000Z')
    const firstDueDate = new Date('2025-10-10T12:00:00.000Z')
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
    const valuesMock = jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) })

    selectMock.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([credit]) }),
    } as never)
    selectMock.mockReturnValueOnce({
      from: () => ({ where: () => ({ orderBy: () => Promise.resolve([]) }) }),
    } as never)
    insertMock.mockReturnValue({ values: valuesMock } as never)

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
