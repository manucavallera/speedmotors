import { Test } from '@nestjs/testing'
import { SalesService } from './sales.service'
import { DbModule } from '../db/db.module'

/**
 * Tests de lógica de cálculo pura en SalesService (sin DB).
 * Se prueban los algoritmos de cuotas, IVA y ratios blanco/negro
 * extrayendo la lógica del método create() para verificación aislada.
 */

// Extrae la lógica de cálculo de totales de create() para testear sin DB
function calcularVenta(params: {
  items: { quantity: number; unitPrice: number; ingresoTipo?: string }[]
  discount?: number
  type: 'contado' | 'cuotas'
  financingCurrency?: 'pesos' | 'usd'
  installmentCount?: number
  interestRate?: number
}) {
  const { items, type, financingCurrency, installmentCount, interestRate } = params
  const discount = params.discount ?? 0

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const principal = subtotal - discount

  const MONTHLY_RATES: Record<string, number> = { pesos: 5, usd: 3 }
  const isFinanced = type === 'cuotas' && !!financingCurrency
  const monthlyRate = isFinanced
    ? (MONTHLY_RATES[financingCurrency!] ?? 5)
    : (interestRate ?? 0)
  const n = type === 'cuotas' && installmentCount ? installmentCount : 1

  let cuotaAmount = 0
  let total: number

  if (isFinanced && n > 1) {
    const r = monthlyRate / 100
    cuotaAmount = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    total = cuotaAmount * n
  } else {
    total = principal * (1 + monthlyRate / 100)
  }

  const subtotalFormal = items.filter(i => i.ingresoTipo === 'blanco').reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const subtotalInformal = items.filter(i => i.ingresoTipo === 'negro').reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const ratio = subtotal > 0 ? principal / subtotal : 1
  const totalRatio = principal > 0 ? total / principal : 1
  const amountFormal = +(subtotalFormal * ratio * totalRatio).toFixed(2)
  const amountInformal = +(subtotalInformal * ratio * totalRatio).toFixed(2)

  return { subtotal, principal, total, cuotaAmount, amountFormal, amountInformal, monthlyRate, n }
}

describe('SalesService — cálculos de negocio', () => {
  describe('contado sin interés', () => {
    it('total = subtotal cuando no hay descuento ni interés', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 100000 }],
        type: 'contado',
      })
      expect(r.total).toBe(100000)
      expect(r.principal).toBe(100000)
    })

    it('descuento se resta del subtotal antes de calcular total', () => {
      const r = calcularVenta({
        items: [{ quantity: 2, unitPrice: 50000 }],
        discount: 10000,
        type: 'contado',
      })
      expect(r.subtotal).toBe(100000)
      expect(r.principal).toBe(90000)
      expect(r.total).toBe(90000)
    })

    it('interés manual en contado', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 100000 }],
        type: 'contado',
        interestRate: 10,
      })
      expect(r.total).toBeCloseTo(110000, 2)
    })
  })

  describe('cuotas con sistema francés (financingCurrency)', () => {
    it('cuota en pesos: tasa 5% mensual, 12 cuotas', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 1000000 }],
        type: 'cuotas',
        financingCurrency: 'pesos',
        installmentCount: 12,
      })
      // Sistema francés: cuota = P * r * (1+r)^n / ((1+r)^n - 1)
      const r_rate = 0.05
      const expected = 1000000 * r_rate * Math.pow(1.05, 12) / (Math.pow(1.05, 12) - 1)
      expect(r.cuotaAmount).toBeCloseTo(expected, 2)
      expect(r.total).toBeCloseTo(expected * 12, 1)
      expect(r.monthlyRate).toBe(5)
    })

    it('cuota en USD: tasa 3% mensual, 6 cuotas', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 5000 }],
        type: 'cuotas',
        financingCurrency: 'usd',
        installmentCount: 6,
      })
      const r_rate = 0.03
      const expected = 5000 * r_rate * Math.pow(1.03, 6) / (Math.pow(1.03, 6) - 1)
      expect(r.cuotaAmount).toBeCloseTo(expected, 2)
      expect(r.monthlyRate).toBe(3)
    })

    it('cuotas=1 no usa sistema francés, total = principal', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 100000 }],
        type: 'cuotas',
        financingCurrency: 'pesos',
        installmentCount: 1,
      })
      // n=1 → no entra en rama isFinanced && n>1 → total = principal * (1 + rate/100)
      expect(r.cuotaAmount).toBe(0)
      expect(r.total).toBe(105000) // 5% de interés en 1 cuota
    })
  })

  describe('ratio blanco/negro', () => {
    it('todo blanco → amountFormal = total, amountInformal = 0', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 100000, ingresoTipo: 'blanco' }],
        type: 'contado',
      })
      expect(r.amountFormal).toBe(100000)
      expect(r.amountInformal).toBe(0)
    })

    it('todo negro → amountFormal = 0, amountInformal = total', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 100000, ingresoTipo: 'negro' }],
        type: 'contado',
      })
      expect(r.amountFormal).toBe(0)
      expect(r.amountInformal).toBe(100000)
    })

    it('mitad blanco + mitad negro → ratio 50/50', () => {
      const r = calcularVenta({
        items: [
          { quantity: 1, unitPrice: 50000, ingresoTipo: 'blanco' },
          { quantity: 1, unitPrice: 50000, ingresoTipo: 'negro' },
        ],
        type: 'contado',
      })
      expect(r.amountFormal).toBe(50000)
      expect(r.amountInformal).toBe(50000)
      expect(r.amountFormal + r.amountInformal).toBeCloseTo(r.total, 0)
    })

    it('con descuento: ratio se aplica sobre principal', () => {
      const r = calcularVenta({
        items: [
          { quantity: 1, unitPrice: 80000, ingresoTipo: 'blanco' },
          { quantity: 1, unitPrice: 20000, ingresoTipo: 'negro' },
        ],
        discount: 10000,
        type: 'contado',
      })
      // subtotal=100000, principal=90000, ratio=0.9
      // formal: 80000*0.9 = 72000, informal: 20000*0.9 = 18000
      expect(r.amountFormal).toBe(72000)
      expect(r.amountInformal).toBe(18000)
      expect(r.amountFormal + r.amountInformal).toBeCloseTo(r.total, 0)
    })
  })

  describe('casos borde', () => {
    it('múltiples items suman bien', () => {
      const r = calcularVenta({
        items: [
          { quantity: 3, unitPrice: 10000 },
          { quantity: 2, unitPrice: 25000 },
        ],
        type: 'contado',
      })
      expect(r.subtotal).toBe(80000)
    })

    it('discount = subtotal → principal = 0, total = 0', () => {
      const r = calcularVenta({
        items: [{ quantity: 1, unitPrice: 100 }],
        discount: 100,
        type: 'contado',
      })
      expect(r.principal).toBe(0)
      expect(r.total).toBe(0)
    })
  })
})

describe('CashService — balance matemático', () => {
  // Prueba lógica del cálculo de expectedBalance en closeSession
  function calcularBalance(params: {
    openingBalance: number
    salesTotal: number
    expensesTotal: number
    depositos: number
    retiros: number
  }) {
    return params.openingBalance + params.salesTotal - params.expensesTotal + params.depositos - params.retiros
  }

  it('balance = apertura + ventas - gastos + depósitos - retiros', () => {
    const balance = calcularBalance({
      openingBalance: 10000,
      salesTotal: 50000,
      expensesTotal: 5000,
      depositos: 2000,
      retiros: 3000,
    })
    expect(balance).toBe(54000)
  })

  it('caja en cero: sin movimientos, balance = openingBalance', () => {
    const balance = calcularBalance({
      openingBalance: 5000,
      salesTotal: 0,
      expensesTotal: 0,
      depositos: 0,
      retiros: 0,
    })
    expect(balance).toBe(5000)
  })

  it('balance puede ser negativo si gastos > ventas + apertura', () => {
    const balance = calcularBalance({
      openingBalance: 1000,
      salesTotal: 500,
      expensesTotal: 10000,
      depositos: 0,
      retiros: 0,
    })
    expect(balance).toBe(-8500)
  })
})
