import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsPage } from './SettingsPage'
import { generatePreprintedCalibration } from '../lib/pdf'

jest.mock('../lib/pdf', () => ({ generatePreprintedCalibration: jest.fn() }))

describe('SettingsPage preprinted form calibration', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('saves separate invoice and remito offsets', () => {
    render(<SettingsPage />)

    fireEvent.change(screen.getByLabelText('Factura A4 X (mm)'), { target: { value: '1.5' } })
    fireEvent.change(screen.getByLabelText('Factura A4 Y (mm)'), { target: { value: '-0.75' } })
    fireEvent.change(screen.getByLabelText('Remito Carta X (mm)'), { target: { value: '-2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar calibración' }))

    expect(JSON.parse(localStorage.getItem('speedmotors_preprinted_offsets') || '{}')).toEqual({
      invoice: { x: 1.5, y: -0.75 },
      remito: { x: -2, y: 0 },
    })
  })

  it('generates a calibration page for the selected form', () => {
    render(<SettingsPage />)

    fireEvent.change(screen.getByLabelText('Factura A4 X (mm)'), { target: { value: '1.25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Prueba factura' }))
    fireEvent.click(screen.getByRole('button', { name: 'Prueba remito' }))

    expect(generatePreprintedCalibration).toHaveBeenNthCalledWith(1, 'invoice', { x: 1.25, y: 0 })
    expect(generatePreprintedCalibration).toHaveBeenNthCalledWith(2, 'remito', { x: 0, y: 0 })
  })
})
