import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateSaleDto } from './create-sale.dto'

describe('CreateSaleDto financiación por tercero', () => {
  const base = {
    type: 'financiado_tercero',
    paymentMethod: 'transferencia',
    items: [{ description: 'Moto', quantity: 1, unitPrice: 100 }],
  }

  it('acepta el tipo nuevo cuando informa la financiera', async () => {
    const errors = await validate(plainToInstance(CreateSaleDto, { ...base, financingProvider: 'Santander' }))
    expect(errors).toHaveLength(0)
  })

  it('rechaza una venta por tercero sin nombre de financiera', async () => {
    const errors = await validate(plainToInstance(CreateSaleDto, base))
    expect(errors.some(error => error.property === 'financingProvider')).toBe(true)
  })
})
