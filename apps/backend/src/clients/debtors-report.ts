export interface DebtorReportSource {
  clientId: number
  creditId: number
  clientName: string
  phone: string | null
  dni: string | null
  cuit: string | null
  creditType: 'cuotas_simples' | 'saldo_compuesto'
  currency: 'pesos' | 'usd'
  balance: number
  lastPaymentAmount: string | null
  lastPaymentDate: Date | string | null
  paidInstallments: number | null
  installmentsCount: number | null
}

export interface DebtorReportRow {
  clientId: number
  creditId: number
  clientName: string
  phone: string | null
  dniOrCuit: string
  financingType: 'Fija' | 'Libre'
  currency: 'Pesos' | 'USD'
  balance: number
  lastPaymentAmount: number | null
  lastPaymentDate: string | null
  installmentProgress: string
}

export function buildDebtorReportRow(source: DebtorReportSource): DebtorReportRow {
  return {
    clientId: source.clientId,
    creditId: source.creditId,
    clientName: source.clientName,
    phone: source.phone,
    dniOrCuit: source.cuit || source.dni || '',
    financingType: source.creditType === 'cuotas_simples' ? 'Fija' : 'Libre',
    currency: source.currency === 'usd' ? 'USD' : 'Pesos',
    balance: Number(source.balance.toFixed(2)),
    lastPaymentAmount: source.lastPaymentAmount == null ? null : Number(source.lastPaymentAmount),
    lastPaymentDate: source.lastPaymentDate == null
      ? null
      : source.lastPaymentDate instanceof Date ? source.lastPaymentDate.toISOString() : source.lastPaymentDate,
    installmentProgress: source.paidInstallments != null && source.installmentsCount != null
      ? `${source.paidInstallments} de ${source.installmentsCount}`
      : '',
  }
}
