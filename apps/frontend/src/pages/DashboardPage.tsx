import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAlerts } from '../hooks/useAlerts'
import { SalesBySellerWidget } from '../components/dashboard/SalesBySellerWidget'

function KPICard({ label, value, sub, icon, gradient, positive }: {
  label: string; value: string; sub?: string; icon: string; gradient: string; positive?: boolean
}) {
  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</p>
        <p style={{ fontSize: '24px', fontWeight: 700, color: positive === false ? '#dc2626' : positive ? '#16a34a' : '#0f172a', lineHeight: 1.2 }}>{value}</p>
        {sub && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{sub}</p>}
      </div>
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        {icon}
      </div>
    </div>
  )
}

function Trend({ current, previous }: { current: number; previous: number; label?: string }) {
  if (previous === 0 && current === 0) return null
  const diff = previous > 0 ? ((current - previous) / previous) * 100 : null
  const up = diff !== null && diff >= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: up ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
      {diff !== null ? (
        <><span>{up ? '▲' : '▼'} {Math.abs(diff).toFixed(0)}%</span><span style={{ color: '#94a3b8', fontWeight: 400 }}>vs mes ant.</span></>
      ) : (
        <span style={{ color: '#94a3b8', fontWeight: 400 }}>sin datos mes ant.</span>
      )}
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: alertsData } = useAlerts()
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/reports/dashboard').then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/products/low-stock').then(r => r.data),
  })

  const tm = dash?.thisMonth
  const lm = dash?.lastMonth

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
          {new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Resumen de {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : tm && (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '8px' }}>
            <KPICard
              label="Facturación del mes"
              value={`$${tm.sales.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
              sub={`${tm.sales.count} ventas`}
              icon="📈"
              gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)"
            />
            <KPICard
              label="Gastos del mes"
              value={`$${tm.expenses.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
              sub={`${tm.expenses.count} registros`}
              icon="📉"
              gradient="linear-gradient(135deg,#ef4444,#dc2626)"
              positive={false}
            />
            <KPICard
              label="Ganancia neta"
              value={`${tm.profit >= 0 ? '+' : ''}$${tm.profit.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
              sub={`Margen ${tm.margin.toFixed(1)}%`}
              icon={tm.profit >= 0 ? '💰' : '⚠️'}
              gradient={tm.profit >= 0 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f59e0b,#d97706)'}
              positive={tm.profit >= 0}
            />
            <KPICard
              label="Vehículos vendidos"
              value={`${dash.vehiclesSoldThisMonth ?? 0}`}
              sub="este mes"
              icon="🏍️"
              gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)"
              positive={dash.vehiclesSoldThisMonth > 0}
            />
            <KPICard
              label="Cuotas vencidas"
              value={dash.overdueInstallments.count > 0 ? `$${dash.overdueInstallments.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}` : 'Al día'}
              sub={dash.overdueInstallments.count > 0 ? `${dash.overdueInstallments.count} cuota${dash.overdueInstallments.count !== 1 ? 's' : ''}` : undefined}
              icon={dash.overdueInstallments.count > 0 ? '🔴' : '✅'}
              gradient={dash.overdueInstallments.count > 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#10b981,#059669)'}
              positive={dash.overdueInstallments.count === 0}
            />
          </div>

          {/* Trends */}
          {lm && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { current: tm.sales.total, previous: lm.sales.total, label: 'ventas' },
                { current: tm.expenses.total, previous: lm.expenses.total, label: 'gastos' },
                { current: tm.profit, previous: lm.profit, label: 'ganancia' },
              ].map((t, i) => (
                <div key={i} style={{ paddingLeft: '4px' }}>
                  <Trend current={t.current} previous={t.previous} label={t.label} />
                </div>
              ))}
              <div />
            </div>
          )}

          {/* Alerts widget */}
          {alertsData && alertsData.summary.total > 0 && (() => {
            const topItems = [
              ...alertsData.installments.overdue.map(i => ({ label: `Cuota ${i.number} — ${i.clientName || 'Cliente'}`, urgency: 'critica' as const, amount: Number(i.amount) })),
              ...alertsData.reminders.overdue.map(r => ({ label: r.title, urgency: 'critica' as const, amount: r.amount ? Number(r.amount) : null })),
              ...alertsData.installments.upcoming.map(i => ({ label: `Cuota ${i.number} — ${i.clientName || 'Cliente'}`, urgency: 'alta' as const, amount: Number(i.amount) })),
              ...alertsData.reminders.upcoming.map(r => ({ label: r.title, urgency: 'alta' as const, amount: r.amount ? Number(r.amount) : null })),
            ].slice(0, 4)
            return (
              <div onClick={() => navigate('/alerts')} style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #fecaca', marginBottom: '20px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>🔔 Alertas pendientes</h3>
                  <span style={{ background: '#dc2626', color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 700, padding: '2px 10px' }}>{alertsData.summary.total}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: '8px', background: item.urgency === 'critica' ? '#fef2f2' : '#fffbeb' }}>
                      <span style={{ fontSize: '12.5px', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ marginRight: '6px' }}>{item.urgency === 'critica' ? '🔴' : '🟡'}</span>{item.label}
                      </span>
                      {item.amount != null && <span style={{ fontSize: '12px', fontWeight: 700, color: item.urgency === 'critica' ? '#dc2626' : '#d97706', flexShrink: 0, marginLeft: '8px' }}>${item.amount.toLocaleString('es-AR')}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>Ver todas las alertas →</div>
              </div>
            )
          })()}

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Formas de pago del mes */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Cobros del mes</h3>
              {tm.byPaymentMethod.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin ventas este mes</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tm.byPaymentMethod.map((m: any) => {
                    const pct = tm.sales.total > 0 ? (m.total / tm.sales.total) * 100 : 0
                    const labels: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta', mixto: 'Mixto' }
                    return (
                      <div key={m.method}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{labels[m.method] || m.method}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>${m.total.toLocaleString('es-AR')}</span>
                        </div>
                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#3b82f6,#1d4ed8)', borderRadius: '99px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Stock bajo */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: lowStock?.length > 0 ? '1px solid #fef3c7' : '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: lowStock?.length > 0 ? '#92400e' : '#0f172a', marginBottom: '16px' }}>
                {lowStock?.length > 0 ? `⚠️ Stock bajo — ${lowStock.length} producto${lowStock.length > 1 ? 's' : ''}` : '📦 Stock'}
              </h3>
              {!lowStock || lowStock.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '16px 0' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                  Todo el stock está en orden
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lowStock.slice(0, 6).map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: '8px', background: '#fffbeb' }}>
                      <span style={{ fontSize: '12.5px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', flexShrink: 0, marginLeft: '8px' }}>{p.stock} u.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ventas por vendedor */}
          {dash.bySeller && dash.bySeller.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <SalesBySellerWidget sellers={dash.bySeller} totalSales={tm.sales.total} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
