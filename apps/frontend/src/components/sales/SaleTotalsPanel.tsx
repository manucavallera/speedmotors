const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 })

function annuity(P: number, r: number, n: number) {
  if (r === 0 || n === 0) return { cuota: n > 0 ? P / n : 0, total: P, interest: 0, rows: [] }
  const cuota = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
  const total = cuota * n
  let saldo = P
  const rows = Array.from({ length: n }, (_, i) => {
    const interes = saldo * r
    const capital = cuota - interes
    saldo = Math.max(0, saldo - capital)
    return { n: i + 1, cuota, interes, capital, saldo }
  })
  return { cuota, total, interest: total - P, rows }
}

interface SaleTotalsPanelProps {
  subtotal: number
  discountAmt: number
  interest: number
  total: number
  invoiceType: 'A' | 'B' | 'X' | 'mixto'
  type: 'contado' | 'cuotas'
  installmentCount: string
  subtotalFormal?: number
  subtotalInformal?: number
  financingCurrency?: 'pesos' | 'usd'
  monthlyRate?: number
}

export function SaleTotalsPanel({
  subtotal, discountAmt, interest, total, invoiceType, type,
  installmentCount, subtotalFormal = 0, subtotalInformal = 0,
  financingCurrency, monthlyRate = 0,
}: SaleTotalsPanelProps) {
  const ratio = subtotal > 0 ? (subtotal - discountAmt) / subtotal : 1
  const totalFormal = +(subtotalFormal * ratio * (1 + interest / 100)).toFixed(2)
  const totalInformal = +(subtotalInformal * ratio * (1 + interest / 100)).toFixed(2)

  const isFinanced = type === 'cuotas' && !!financingCurrency && monthlyRate > 0
  const n = Number(installmentCount)
  const principal = subtotal - discountAmt
  const { cuota, total: financedTotal, interest: totalInterest, rows } = isFinanced
    ? annuity(principal, monthlyRate / 100, n)
    : { cuota: 0, total, interest: 0, rows: [] }

  const currencyLabel = financingCurrency === 'usd' ? 'USD' : 'Pesos'
  const currencyColor: [string, string] = financingCurrency === 'usd' ? ['#0e7490', '#cffafe'] : ['#7c3aed', '#ede9fe']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Totales base */}
      <div style={{ background: '#f8fafc', borderRadius: isFinanced ? '10px 10px 0 0' : '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
          <span>Subtotal</span><span>${fmt(subtotal)}</span>
        </div>
        {discountAmt > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc2626' }}>
            <span>Descuento</span><span>-${fmt(discountAmt)}</span>
          </div>
        )}
        {!isFinanced && interest > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#d97706' }}>
            <span>Interés ({interest}%)</span><span>+${fmt((subtotal - discountAmt) * interest / 100)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '2px' }}>
          <span>{isFinanced ? 'Capital a financiar' : 'Total'}</span>
          <span>${fmt(isFinanced ? principal : total)}</span>
        </div>
        {invoiceType === 'mixto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#1d4ed8' }}>
              <span>🧾 Facturable (en blanco)</span><span>${fmt(totalFormal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#854d0e' }}>
              <span>🤝 Sin factura (en negro)</span><span>${fmt(totalInformal)}</span>
            </div>
          </div>
        )}
        {invoiceType === 'A' && !isFinanced && (
          <div style={{ fontSize: '12px', color: '#2563eb', textAlign: 'right' }}>
            IVA 21% incl.: ${fmt(total * 21 / 121)} · Neto: ${fmt(total / 1.21)}
          </div>
        )}
        {type === 'cuotas' && !isFinanced && Number(installmentCount) > 1 && (
          <div style={{ fontSize: '12px', color: '#7c3aed', textAlign: 'right' }}>
            {installmentCount} cuotas de ${fmt(total / Number(installmentCount))}
          </div>
        )}
      </div>

      {/* Panel de crédito */}
      {isFinanced && n > 1 && (
        <div style={{ border: `1.5px solid ${currencyColor[0]}`, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
          {/* Header crédito */}
          <div style={{ background: currencyColor[0], padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px' }}>
              FINANCIACIÓN EN {currencyLabel.toUpperCase()} · {monthlyRate}% MENSUAL TEM
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
              INTERÉS COMPUESTO
            </span>
          </div>

          {/* KPIs del crédito */}
          <div style={{ background: currencyColor[1], padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: currencyColor[0], marginBottom: '3px' }}>CUOTA MENSUAL</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>${fmt(cuota)}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>× {n} meses</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: `1px solid ${currencyColor[0]}20`, borderRight: `1px solid ${currencyColor[0]}20` }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: currencyColor[0], marginBottom: '3px' }}>TOTAL A PAGAR</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>${fmt(financedTotal)}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{n} cuotas</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626', marginBottom: '3px' }}>INTERÉS TOTAL</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>+${fmt(totalInterest)}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{((totalInterest / principal) * 100).toFixed(1)}% del capital</div>
            </div>
          </div>

          {/* Tabla de amortización */}
          <div style={{ padding: '0 16px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px', marginTop: '10px', letterSpacing: '0.5px' }}>
              TABLA DE AMORTIZACIÓN
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['N°', 'Cuota', 'Interés', 'Capital', 'Saldo'].map(h => (
                      <th key={h} style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#475569', firstChild: { textAlign: 'center' } as any }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.n} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{row.n}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a' }}>${fmt(row.cuota)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626' }}>${fmt(row.interes)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#16a34a' }}>${fmt(row.capital)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>${fmt(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
