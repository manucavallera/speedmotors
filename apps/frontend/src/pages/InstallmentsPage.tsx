import { toast } from '../lib/toast'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { inputStyle } from '../components/ui/FormField'
import { InfoBanner } from '../components/ui/InfoBanner'
import { InstallmentsSection } from '../components/installments/InstallmentsSection'
import { Pagination } from '../components/ui/Pagination'

export function InstallmentsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [clientSearch, setClientSearch] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)

  useEffect(() => { setPage(1) }, [clientSearch, overdueOnly])

  const { data, isLoading } = useQuery({
    queryKey: ['installments-pending', { page, overdueOnly, clientSearch }],
    queryFn: () => api.get('/sales/installments/pending', {
      params: { page, limit: 50, overdue: overdueOnly || undefined, search: clientSearch || undefined },
    }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const items: any[] = data?.items ?? []
  const total: number = data?.total ?? 0
  const pages: number = data?.pages ?? 1
  const overdueCount: number = data?.overdueCount ?? 0
  const overdueTotal: number = data?.overdueTotal ?? 0
  const upcomingCount: number = data?.upcomingCount ?? 0
  const upcomingTotal: number = data?.upcomingTotal ?? 0

  const pay = useMutation({
    mutationFn: (id: number) => api.post(`/sales/installments/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installments-pending'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdue = items.filter(i => new Date(i.dueDate) < today)
  const upcoming = items.filter(i => new Date(i.dueDate) >= today)

  function handleOverdueToggle(val: boolean) { setOverdueOnly(val); setPage(1) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Cuotas pendientes</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
            {total} cuota{total !== 1 ? 's' : ''} sin cobrar
          </p>
        </div>
      </div>

      <InfoBanner title="Cobranza de cuotas">
        Cuotas de ventas en cuotas que <strong>todavía no fueron cobradas</strong>. Las <strong style={{ color: '#dc2626' }}>vencidas aparecen en rojo</strong> y son las que tenés que reclamar primero. Cuando recibís el pago, hacé clic en "Cobrar".
      </InfoBanner>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, marginBottom: '4px' }}>VENCIDAS</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>${Number(overdueTotal).toLocaleString('es-AR')}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{overdueCount} cuota{overdueCount !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, marginBottom: '4px' }}>PRÓXIMAS</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>${Number(upcomingTotal).toLocaleString('es-AR')}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{upcomingCount} cuota{upcomingCount !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buscar cliente</span>
          <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Nombre..." style={{ ...inputStyle }} />
        </div>

        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {([false, true] as boolean[]).map(val => (
              <button key={String(val)} onClick={() => handleOverdueToggle(val)}
                style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: overdueOnly === val ? (val ? '#dc2626' : '#1d4ed8') : '#f1f5f9', color: overdueOnly === val ? 'white' : '#374151' }}>
                {val ? 'Solo vencidas' : 'Todas'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'white', borderRadius: '14px', color: '#94a3b8', fontSize: '14px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          No hay cuotas pendientes
        </div>
      ) : (
        <>
          <InstallmentsSection title="Vencidas" items={overdue} color="#dc2626" today={today} onPay={id => pay.mutate(id)} isPending={pay.isPending} />
          <InstallmentsSection title="Próximas" items={upcoming} color="#d97706" today={today} onPay={id => pay.mutate(id)} isPending={pay.isPending} />
        </>
      )}

      <Pagination page={page} pages={pages} total={total} onPage={setPage} />
    </div>
  )
}
