import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ValuationEditor } from './ValuationEditor'
import type { DraftGroup, ValuationVehicleUnit } from '../../types/stock-valuation.types'

const unit: ValuationVehicleUnit = {
  id: 42,
  internalCode: 'SM-042',
  brand: 'Honda',
  model: 'Wave',
  version: 'S',
  status: 'disponible',
  chassisNumber: 'CH-42',
  engineNumber: 'EN-42',
}

const group: DraftGroup = {
  groupKey: 'honda\u001fwave\u001fs',
  brand: 'Honda',
  model: 'Wave',
  version: 'S',
  vehicleIds: [42],
  availableUnits: 1,
  reservedUnits: 0,
  totalUnits: 1,
  units: [unit],
  currentCostPrice: 100,
  currentSellPrice: 125,
  costPrice: '100',
  saleMode: 'margin',
  manualSellPrice: '',
  marginPercent: '',
}

describe('ValuationEditor', () => {
  it('shows unit details, edits the selected unit, and hides the details again', async () => {
    const user = userEvent.setup()
    const onEditUnit = jest.fn<(selected: ValuationVehicleUnit) => void>()

    render(
      <ValuationEditor
        groups={[group]}
        generalMargin="25"
        onGeneralMarginChange={() => undefined}
        onGroupsChange={() => undefined}
        onEditUnit={onEditUnit}
      />,
    )

    expect(screen.getByText('Sin cambios')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ver motos (1)' }))

    expect(screen.getByText('SM-042')).toBeTruthy()
    expect(screen.getByText('Honda Wave S')).toBeTruthy()
    expect(screen.getByText('Disponible')).toBeTruthy()
    expect(screen.getByText('Cuadro: CH-42')).toBeTruthy()
    expect(screen.getByText('Motor: EN-42')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onEditUnit).toHaveBeenCalledWith(unit)

    await user.click(screen.getByRole('button', { name: 'Ocultar motos' }))
    expect(screen.queryByText('SM-042')).toBeNull()
  })
})
