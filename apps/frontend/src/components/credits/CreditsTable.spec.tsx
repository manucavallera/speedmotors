import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import type { Credit } from '../../hooks/useCredits'
import { CreditsTable } from './CreditsTable'

const credit = (overrides: Partial<Credit>): Credit => ({
  id: 1,
  clientId: 1,
  client: { id: 1, name: 'Gómez Motos' },
  creditType: 'saldo_compuesto',
  currency: 'pesos',
  originalAmount: '1000',
  interestRate: '5',
  startDate: '2026-08-14T00:00:00.000Z',
  status: 'activo',
  balance: 1000,
  ...overrides,
})

describe('CreditsTable', () => {
  it('shows the filtered empty message', () => {
    render(
      <CreditsTable
        credits={[]}
        isLoading={false}
        emptyMessage="No hay créditos para estos filtros"
        onView={() => undefined}
      />,
    )

    expect(screen.getByText('No hay créditos para estos filtros')).toBeTruthy()
  })

  it.each([
    [credit({ creditType: 'cuotas_simples' }), 'Financiación fija'],
    [credit({ interestRate: '5' }), 'Cuota libre'],
    [credit({ interestRate: '0' }), 'Cuenta corriente'],
  ])('shows the debt type label', (item, expected) => {
    render(<CreditsTable credits={[item]} isLoading={false} onView={() => undefined} />)
    expect(screen.getByText(expected)).toBeTruthy()
  })
})
