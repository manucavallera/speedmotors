import * as XLSX from 'xlsx'
import type { DebtorReportRow } from '../types/clients.types'

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : ''
}

export function buildDebtorsWorksheetRows(rows: DebtorReportRow[]): (string | number)[][] {
  const headers = ['Cliente', 'DNI / CUIT', 'Teléfono', 'Tipo de financiación', 'Moneda', 'Saldo', 'Última entrega', 'Fecha última entrega', 'Cuotas']
  const data = rows.map(row => [
    row.clientName,
    row.dniOrCuit,
    row.phone || '',
    row.financingType,
    row.currency,
    row.balance,
    row.lastPaymentAmount ?? '',
    formatDate(row.lastPaymentDate),
    row.installmentProgress,
  ])
  const totals = rows.reduce<Record<DebtorReportRow['currency'], number>>((acc, row) => {
    acc[row.currency] += row.balance
    return acc
  }, { Pesos: 0, USD: 0 })
  const totalRows = (['Pesos', 'USD'] as const)
    .filter(currency => totals[currency] > 0)
    .map(currency => [`TOTAL DEUDA ${currency.toUpperCase()}`, '', '', '', '', Number(totals[currency].toFixed(2)), '', '', ''])
  return [headers, ...data, [], ...totalRows]
}

export function exportDebtorsXlsx(rows: DebtorReportRow[]): void {
  const sheet = XLSX.utils.aoa_to_sheet(buildDebtorsWorksheetRows(rows))
  sheet['!cols'] = [
    { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 10 },
    { wch: 15 }, { wch: 16 }, { wch: 20 }, { wch: 12 },
  ]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Deudores')
  XLSX.writeFile(workbook, `deudores-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
