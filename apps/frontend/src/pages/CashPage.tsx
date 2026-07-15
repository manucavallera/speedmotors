import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnSecondary } from '../components/ui/FormField'
import { CashStatusPanel } from '../components/cash/CashStatusPanel'
import { CashSessionsTable } from '../components/cash/CashSessionsTable'
import { CashMovementModal, type CashMovementData } from '../components/cash/CashMovementModal'

export function CashPage() {
  const qc = useQueryClient()
  const [movementModal, setMovementModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'todas' | 'abierta' | 'cerrada'>('todas')
  // Cajas separadas: la de SpeedMotors (ventas de motos/lanchas) y la de la marina (guardería/turnera/proveeduría)
  const [area, setArea] = useState<'speedmotors' | 'marina'>('speedmotors')

  const { data: summary, isLoading } = useQuery({
    queryKey: ['cash-summary', area],
    queryFn: () => api.get('/cash/summary', { params: { area } }).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['cash-sessions', area],
    queryFn: () => api.get('/cash', { params: { area } }).then(r => r.data),
  })

  const open = useMutation({
    mutationFn: (openingBalance: number) => api.post('/cash/open', { openingBalance, area }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-summary'] }); qc.invalidateQueries({ queryKey: ['cash-sessions'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const close = useMutation({
    mutationFn: ({ notes, countedBalance }: { notes: string; countedBalance?: number }) =>
      api.post('/cash/close', { notes: notes || undefined, countedBalance, area }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-summary'] }); qc.invalidateQueries({ queryKey: ['cash-sessions'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const createMovement = useMutation({
    mutationFn: (d: CashMovementData) => api.post('/cash/movement', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-summary'] }); setMovementModal(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const removeSession = useMutation({
    mutationFn: (id: number) => api.delete(`/cash/sessions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-sessions'] }); qc.invalidateQueries({ queryKey: ['cash-summary'] }); toast.success('Sesión eliminada') },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Caja</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Control de apertura y cierre de caja diaria</p>
        </div>
        {summary?.session && (
          <button onClick={() => setMovementModal(true)} style={btnSecondary}>+ Movimiento manual</button>
        )}
      </div>

      {/* Selector de caja: SpeedMotors y marina son cajas independientes, cada una con su apertura y cierre */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {([['speedmotors', 'SpeedMotors'], ['marina', 'Marina']] as const).map(([a, label]) => (
          <button key={a} onClick={() => setArea(a)}
            style={{ padding: '8px 20px', fontSize: '14px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer', border: area === a ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0', background: area === a ? '#2563eb' : '#fff', color: area === a ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
      </div>

      <InfoBanner title={area === 'marina' ? 'Caja de la marina' : 'Caja de SpeedMotors'}>
        {area === 'marina' ? (
          <>Caja aparte de SpeedMotors. Acá entra la plata de <strong>guardería</strong>, <strong>turnera</strong> y <strong>proveeduría</strong>. <strong>Abrís caja</strong> con un saldo inicial y <strong>cerrás</strong> declarando lo contado; el sistema suma los cobros del día y calcula cuánto debería haber. Las ventas de motos/lanchas y los gastos no cuentan acá: van a la caja de SpeedMotors.</>
        ) : (
          <>Llevá el control del efectivo del día. <strong>Abrís caja</strong> al empezar con un saldo inicial, y <strong>cerrás caja</strong> al final del día declarando lo que contaste. El sistema calcula cuánto debería haber: las ventas al <strong>contado</strong> suman el total, las ventas <strong>financiadas</strong> suman solo la seña cobrada, las ventas en <strong>cuenta corriente</strong> no suman nada (el efectivo entra cuando el cliente paga). Los gastos descuentan del saldo esperado. Si hay diferencia entre lo declarado y lo calculado, queda registrada.</>
        )}
      </InfoBanner>

      <CashStatusPanel
        summary={summary}
        isLoading={isLoading}
        onOpen={(balance) => open.mutate(balance)}
        onClose={(notes, counted) => close.mutate({ notes, countedBalance: counted })}
        isPendingOpen={open.isPending}
        isPendingClose={close.isPending}
      />

      {sessions.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {(['todas', 'abierta', 'cerrada'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '20px', cursor: 'pointer', border: statusFilter === s ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0', background: statusFilter === s ? '#eff6ff' : '#fff', color: statusFilter === s ? '#2563eb' : '#64748b' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <CashSessionsTable sessions={statusFilter === 'todas' ? sessions : (sessions as any[]).filter((s: any) => s.status === statusFilter)} onDelete={id => removeSession.mutate(id)} deletePending={removeSession.isPending} />
        </>
      )}

      {movementModal && summary?.session && (
        <CashMovementModal
          sessionId={summary.session.id}
          onClose={() => setMovementModal(false)}
          onSubmit={(data) => createMovement.mutate(data)}
          isPending={createMovement.isPending}
        />
      )}
    </div>
  )
}
