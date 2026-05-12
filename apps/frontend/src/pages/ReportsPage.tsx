// @file: ReportsPage.tsx | Cáscara orquestadora de reportes. Lógica en useReports, UI en Report*.
import { inputStyle } from '../components/ui/FormField'
import { InfoBanner } from '../components/ui/InfoBanner'
import { ReportKPIs } from '../components/reports/ReportKPIs'
import { ReportMonthlyChart } from '../components/reports/ReportMonthlyChart'
import { ReportTopLists } from '../components/reports/ReportTopLists'
import { ReportBreakdowns } from '../components/reports/ReportBreakdowns'
import { useReports } from '../hooks/useReports'
import { PRESET_RANGES } from '../lib/reports/presets'

export function ReportsPage() {
  const { data, isLoading, range, setRange, activePreset, applyPreset } = useReports()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Reportes</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Balance gerencial con comparación de períodos</p>
        </div>
      </div>

      <InfoBanner title="Panel gerencial">
        Resumen económico del negocio con <strong>comparación contra el período anterior</strong>, top clientes, productos más vendidos y evolución de los últimos 6 meses. Las flechas verde/rojo te dicen si estás mejorando o empeorando respecto del período anterior del mismo largo.
      </InfoBanner>

      <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESET_RANGES.map((p, i) => (
            <button key={p.label} onClick={() => applyPreset(i)}
              style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: activePreset === i ? '#0f172a' : '#f1f5f9',
                color: activePreset === i ? 'white' : '#374151' }}>
              {p.label}
            </button>
          ))}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <input type="date" value={range.from} onChange={e => { applyPreset(-1); setRange(r => ({ ...r, from: e.target.value })) }}
              style={{ ...inputStyle, width: '140px', padding: '6px 10px' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>→</span>
            <input type="date" value={range.to} onChange={e => { applyPreset(-1); setRange(r => ({ ...r, to: e.target.value })) }}
              style={{ ...inputStyle, width: '140px', padding: '6px 10px' }} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>Cargando reportes...</div>
      ) : data && (
        <>
          <ReportKPIs data={data} />
          <ReportMonthlyChart monthlyEvolution={data.monthlyEvolution} />
          <ReportTopLists topClients={data.topClients} topProducts={data.topProducts} />
          <ReportBreakdowns
            installments={data.installments}
            byPaymentMethod={data.current.byPaymentMethod}
            expensesByCategory={data.current.expensesByCategory}
            totalSales={data.current.sales.total}
            totalExpenses={data.current.expenses.total}
            billingFormal={data.current.sales.totalFormal ?? 0}
            billingInformal={data.current.sales.totalInformal ?? 0}
          />
        </>
      )}
    </div>
  )
}
