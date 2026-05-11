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

  const { data: summary, isLoading } = useQuery({
    queryKey: ['cash-summary'],
    queryFn: () => api.get('/cash/summary').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['cash-sessions'],
    queryFn: () => api.get('/cash').then(r => r.data),
  })

  const open = useMutation({
    mutationFn: (openingBalance: number) => api.post('/cash/open', { openingBalance }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-summary', 'cash-sessions'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const close = useMutation({
    mutationFn: ({ notes, countedBalance }: { notes: string; countedBalance?: number }) =>
      api.post('/cash/close', { notes: notes || undefined, countedBalance }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-summary', 'cash-sessions'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const createMovement = useMutation({
    mutationFn: (d: CashMovementData) => api.post('/cash/movement', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-summary'] }); setMovementModal(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Caja</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Control de apertura y cierre de caja diaria</p>
        </div>
        {summary?.session && (
          <button onClick={() => setMovementModal(true)} style={btnSecondary}>+ Movimiento manual</button>
        )}
      </div>

      <InfoBanner title="Caja diaria">
        Llevá el control del efectivo del día. <strong>Abrís caja</strong> al empezar con un saldo inicial, y <strong>cerrás caja</strong> al final del día declarando lo que contaste. El sistema te muestra cuánto debería haber según las ventas en efectivo y los gastos. Si hay diferencia entre lo declarado y lo esperado, queda registrada.
      </InfoBanner>

      <CashStatusPanel
        summary={summary}
        isLoading={isLoading}
        onOpen={(balance) => open.mutate(balance)}
        onClose={(notes, counted) => close.mutate({ notes, countedBalance: counted })}
        isPendingOpen={open.isPending}
        isPendingClose={close.isPending}
      />

      {sessions.length > 0 && <CashSessionsTable sessions={sessions} />}

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
