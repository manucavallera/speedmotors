import { paymentReducesInterestBase } from './credit-interest'

describe('credit interest periods', () => {
  const firstDueDate = new Date('2026-10-10T12:00:00.000Z')

  it('lets payments before the first due month reduce the first interest base', () => {
    expect(paymentReducesInterestBase(
      new Date('2026-09-14T12:00:00.000Z'),
      firstDueDate,
      firstDueDate,
    )).toBe(true)
  })

  it('charges the current month interest before payments made through its due date', () => {
    expect(paymentReducesInterestBase(
      new Date('2026-10-09T12:00:00.000Z'),
      firstDueDate,
      firstDueDate,
    )).toBe(false)
  })

  it('moves a payment after the due date into the next interest period', () => {
    expect(paymentReducesInterestBase(
      new Date('2026-10-11T12:00:00.000Z'),
      new Date('2026-11-10T12:00:00.000Z'),
      firstDueDate,
    )).toBe(false)
  })

  it('lets a payment made on the due date reduce the following period base', () => {
    expect(paymentReducesInterestBase(
      new Date('2026-10-10T12:00:00.000Z'),
      new Date('2026-11-10T12:00:00.000Z'),
      firstDueDate,
    )).toBe(true)
  })
})
