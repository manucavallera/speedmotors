import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { ValuationActionBar } from './ValuationActionBar'

const renderActionBar = (overrides: Partial<ComponentProps<typeof ValuationActionBar>> = {}) => {
  const actions = {
    onManage: jest.fn(),
    onRefresh: jest.fn(),
    onPreview: jest.fn(),
    onClose: jest.fn(),
  }

  render(
    <ValuationActionBar
      previewReady={false}
      previewBlockReason={null}
      errors={[]}
      isRefreshing={false}
      isPreviewing={false}
      isClosing={false}
      {...actions}
      {...overrides}
    />,
  )

  return actions
}

describe('ValuationActionBar', () => {
  it('runs each available valuation action', async () => {
    const user = userEvent.setup()
    const actions = renderActionBar({ previewReady: true })

    await user.click(screen.getByRole('button', { name: 'Gestionar motos' }))
    await user.click(screen.getByRole('button', { name: 'Actualizar stock' }))
    await user.click(screen.getByRole('button', { name: 'Previsualizar cierre' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar cierre' }))

    expect(actions.onManage).toHaveBeenCalledTimes(1)
    expect(actions.onRefresh).toHaveBeenCalledTimes(1)
    expect(actions.onPreview).toHaveBeenCalledTimes(1)
    expect(actions.onClose).toHaveBeenCalledTimes(1)
  })

  it('disables busy or blocked actions without rendering period status', () => {
    renderActionBar({
      previewReady: true,
      previewBlockReason: 'Completá los precios',
      isRefreshing: true,
      isPreviewing: true,
      isClosing: true,
    })

    expect((screen.getByRole('button', { name: 'Actualizando…' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Calculando…' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText(/Sin cerrar|Con cambios sin previsualizar|Previsualización lista|Cierre guardado/)).toBeNull()
  })
})
