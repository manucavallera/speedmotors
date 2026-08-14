import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ValuationPeriodControl, type ValuationPeriodStatusTone } from './ValuationPeriodControl'

const statusCases: Array<{ status: string; statusTone: ValuationPeriodStatusTone }> = [
  { status: 'Cierre guardado el 14/08/2026', statusTone: 'closed' },
  { status: 'Con cambios sin previsualizar', statusTone: 'dirty' },
  { status: 'Previsualización lista', statusTone: 'preview' },
]

describe('ValuationPeriodControl', () => {
  it('keeps the selected month and its status together and reports period changes', () => {
    const onPeriodChange = jest.fn<(period: string) => void>()

    render(
      <ValuationPeriodControl
        period="2026-08"
        status="Sin cerrar"
        statusTone="neutral"
        onPeriodChange={onPeriodChange}
      />,
    )

    const control = screen.getByRole('group', { name: 'Período de valuación' })
    const periodInput = within(control).getByLabelText('Período') as HTMLInputElement

    expect(periodInput.value).toBe('2026-08')
    expect(within(control).getByText('Sin cerrar')).toBeTruthy()

    fireEvent.change(periodInput, { target: { value: '2026-07' } })

    expect(onPeriodChange).toHaveBeenCalledWith('2026-07')
  })

  it.each(statusCases)('shows the $status status copy', ({ status, statusTone }) => {
    render(
      <ValuationPeriodControl
        period="2026-08"
        status={status}
        statusTone={statusTone}
        onPeriodChange={() => undefined}
      />,
    )

    expect(screen.getByText(status)).toBeTruthy()
  })
})
