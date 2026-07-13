import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { type MonthPreview } from '../../types/guarderia.types'

interface Props {
  submitting: boolean
  onClose: () => void
  onGenerate: (periodLabel: string) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')
const thisMonth = () => new Date().toISOString().slice(0, 7)

// Genera el cobro del mes de todas las lanchas de una vez: cuna + servicios fijos (seguros)
export function MonthChargeModal({ submitting, onClose, onGenerate }: Props) {
  const [period, setPeriod] = useState(thisMonth())

  const { data, isLoading } = useQuery<MonthPreview>({
    queryKey: ['guarderia', 'month', period],
    queryFn: () => api.get('/guarderia/month/preview', { params: { period } }).then(r => r.data),
    enabled: /^\d{4}-\d{2}$/.test(period),
  })

  const nada = data && data.units === 0

  return (
    <Modal title="Generar cobros del mes" onClose={onClose}>
      <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
        Arma la deuda del mes de todas las lanchas guardadas: la cuna según su tarifa, más los seguros
        que tenga contratados. Queda como deuda — después vas saldando a medida que te pagan.
      </div>

      <FormField label="Mes a cobrar">
        <input style={inputStyle} type="month" value={period} onChange={e => setPeriod(e.target.value)} />
      </FormField>

      {isLoading && <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Calculando...</div>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{data.units}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>lanchas a cobrar</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{fmt(data.total)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>total del mes</div>
            </div>
          </div>

          {data.alreadyCharged > 0 && (
            <div style={{ fontSize: '12px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '8px 10px', marginBottom: '12px' }}>
              Este mes ya tiene {data.alreadyCharged} cobro{data.alreadyCharged > 1 ? 's' : ''} generado{data.alreadyCharged > 1 ? 's' : ''}. Esas lanchas se saltean: no se duplica nada.
            </div>
          )}

          {nada ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1.5px dashed #e2e8f0', borderRadius: '10px' }}>
              No queda ninguna lancha por cobrar en este mes.
            </div>
          ) : (
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {data.detail.map(u => (
                <div key={u.unitId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '8px 11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {u.clientName ?? '—'} <span style={{ color: '#94a3b8', fontWeight: 400 }}>· {u.spotCode ?? 'trailer'}</span>
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{fmt(u.total)}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    {u.items.map(it => it.concept).join(' + ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button style={btnSecondary} onClick={onClose}>Cancelar</button>
        <button
          style={btnPrimary}
          disabled={submitting || !data || nada}
          onClick={() => onGenerate(period)}
        >
          Generar {data && !nada ? `${data.units} cobros` : ''}
        </button>
      </div>
    </Modal>
  )
}
