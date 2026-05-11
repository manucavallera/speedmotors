import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { btnSecondary, inputStyle } from '../components/ui/FormField'
import { InfoBanner } from '../components/ui/InfoBanner'
import { InstallmentsSection } from '../components/installments/InstallmentsSection'

export function InstallmentsPage() {
  const qc = useQueryClient()
  const [clientFilter, setClientFilter] = useState('')

  const { data: rawInstallments = [], isLoading } = useQuery({
    queryKey: ['installments-pending'],
    queryFn: () => api.get('/sales/installments/pending').then(r => r.data),
  })

  const pay = useMutation({
    mutationFn: (id: number) => api.post(`/sales/installments/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installments-pending'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const installments = clientFilter
    ? rawInstallments.filter((i: any) => String(i.clientId) === clientFilter)
    : rawInstallments

  const overdue = installments.filter((i: any) => new Date(i.dueDate) < today)
  const upcoming = installments.filter((i: any) => new Date(i.dueDate) >= today)
  const totalOverdue = overdue.reduce((s: number, i: any) => s + Number(i.amount), 0)
  const totalUpcoming = upcoming.reduce((s: number, i: any) => s + Number(i.amount), 0)

  const clientsWithPending = Array.from(
    new Map(rawInstallments.filter((i: any) => i.clientId).map((i: any) => [i.clientId, i.clientName])).entries()
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Cuotas pendientes</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
          {installments.length} cuota{installments.length !== 1 ? 's' : ''} sin cobrar
          {clientFilter && ` · filtradas de ${rawInstallments.length}`}
        </p>
      </div>

      <InfoBanner title="Cobranza de cuotas">
        Cuotas de ventas en cuotas que <strong>todavía no fueron cobradas</strong>. Las <strong style={{ color: '#dc2626' }}>vencidas aparecen en rojo</strong> y son las que tenés que reclamar primero. Cuando recibís el pago de una cuota, hacé clic en "Cobrar". También podés filtrar por cliente para ver qué te debe cada uno.
      </InfoBanner>

      {rawInstallments.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '280px' }}>
            <option value="">Todos los clientes</option>
            {clientsWithPending.map(([id, name]) => (
              <option key={id as number} value={id as number}>{name as string}</option>
            ))}
          </select>
          {clientFilter && (
            <button onClick={() => setClientFilter('')} style={{ ...btnSecondary, fontSize: '12px', padding: '6px 12px' }}>Limpiar filtro</button>
          )}
        </div>
      )}

      {installments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, marginBottom: '4px' }}>VENCIDAS</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>${totalOverdue.toLocaleString('es-AR')}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{overdue.length} cuota{overdue.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, marginBottom: '4px' }}>PRÓXIMAS</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>${totalUpcoming.toLocaleString('es-AR')}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{upcoming.length} cuota{upcoming.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : installments.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'white', borderRadius: '14px', color: '#94a3b8', fontSize: '14px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          No hay cuotas pendientes
        </div>
      ) : (
        <>
          <InstallmentsSection title="Vencidas" items={overdue} color="#dc2626" today={today} onPay={(id) => pay.mutate(id)} isPending={pay.isPending} />
          <InstallmentsSection title="Próximas" items={upcoming} color="#d97706" today={today} onPay={(id) => pay.mutate(id)} isPending={pay.isPending} />
        </>
      )}
    </div>
  )
}
