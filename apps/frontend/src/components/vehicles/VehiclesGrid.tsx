import { useState } from 'react'
import { QRModal } from '../ui/QRModal'
import { btnSecondary } from '../ui/FormField'

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  disponible: { bg: '#f0fdf4', color: '#16a34a', label: 'Disponible' },
  reservado:  { bg: '#fffbeb', color: '#d97706', label: 'Reservado' },
  vendido:    { bg: '#f1f5f9', color: '#64748b', label: 'Vendido' },
}

interface VehiclesGridProps {
  vehicles: any[]
  isLoading: boolean
  onEdit: (v: any) => void
  onDelete: (id: number) => void
}

export function VehiclesGrid({ vehicles, isLoading, onEdit, onDelete }: VehiclesGridProps) {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | ''>('')
  const [ingresoFilter, setIngresoFilter] = useState<'blanco' | 'negro' | ''>('')
  const [qrVehicle, setQrVehicle] = useState<any>(null)

  const filtered = vehicles
    .filter(v => !typeFilter || v.type === typeFilter)
    .filter(v => !statusFilter || v.status === statusFilter)
    .filter(v => !ingresoFilter || v.ingresoTipo === ingresoFilter)

  const sorted = [...filtered].sort((a, b) => {
    if (!priceSort) return 0
    return priceSort === 'asc' ? Number(a.sellPrice) - Number(b.sellPrice) : Number(b.sellPrice) - Number(a.sellPrice)
  })

  const cheapest = filtered.length ? filtered.reduce((m, v) => Number(v.sellPrice) < Number(m.sellPrice) ? v : m, filtered[0]) : null
  const priciest = filtered.length ? filtered.reduce((m, v) => Number(v.sellPrice) > Number(m.sellPrice) ? v : m, filtered[0]) : null

  const btnFilter = (active: boolean) => ({
    padding: '7px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer',
    background: active ? '#1d4ed8' : '#f1f5f9', color: active ? 'white' : '#374151',
  } as React.CSSProperties)

  const btnFilterDark = (active: boolean) => ({
    ...btnFilter(active), background: active ? '#0f172a' : '#f1f5f9',
  } as React.CSSProperties)

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {([['', 'Todos'], ['moto', '🏍️ Motos'], ['lancha', '⛵ Lanchas']] as [string, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setTypeFilter(val)} style={btnFilter(typeFilter === val)}>{label}</button>
        ))}
        <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
        {([['', 'Todos los estados'], ['disponible', 'Disponibles'], ['reservado', 'Reservados'], ['vendido', 'Vendidos']] as [string, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)} style={btnFilterDark(statusFilter === val)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {([['', 'Todo ingreso'], ['blanco', '🧾 En blanco'], ['negro', '🤝 En negro']] as [string, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setIngresoFilter(val as 'blanco' | 'negro' | '')} style={btnFilterDark(ingresoFilter === val)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {([['', 'Sin orden'], ['asc', '↑ Más baratos'], ['desc', '↓ Más caros']] as [string, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setPriceSort(val as 'asc' | 'desc' | '')} style={btnFilter(priceSort === val)}>{label}</button>
        ))}
      </div>

      {cheapest && priciest && cheapest.id !== priciest.id && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', marginBottom: '2px' }}>MÁS BARATO</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{cheapest.brand} {cheapest.model}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>${Number(cheapest.sellPrice).toLocaleString('es-AR')}</div>
          </div>
          <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '2px' }}>MÁS CARO</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{priciest.brand} {priciest.model}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>${Number(priciest.sellPrice).toLocaleString('es-AR')}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : vehicles.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '14px' }}>
          No hay vehículos registrados
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {sorted.map((v: any) => {
            const st = statusColors[v.status] || statusColors.disponible
            return (
              <div key={v.id} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px' }}>{v.type === 'moto' ? '🏍️' : '⛵'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{v.brand} {v.model}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.year || '—'} · {v.color || '—'}</div>
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                {v.chassisNumber && (
                  <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '7px', marginBottom: '6px', fontFamily: 'monospace' }}>
                    Chasis: {v.chassisNumber}
                  </div>
                )}
                {v.importCode && (
                  <div style={{ fontSize: '12px', color: '#7c3aed', background: '#f5f3ff', padding: '6px 10px', borderRadius: '7px', marginBottom: '6px', fontFamily: 'monospace' }}>
                    Imp: {v.importCode}
                  </div>
                )}
                {v.ingresoTipo && (
                  <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', marginBottom: '12px',
                    background: v.ingresoTipo === 'blanco' ? '#eff6ff' : '#fef9c3',
                    color: v.ingresoTipo === 'blanco' ? '#1d4ed8' : '#854d0e' }}>
                    {v.ingresoTipo === 'blanco' ? '🧾 En blanco' : '🤝 En negro'}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Precio de venta</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>${Number(v.sellPrice).toLocaleString('es-AR')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Costo</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>${Number(v.costPrice).toLocaleString('es-AR')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setQrVehicle(v)} style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>QR</button>
                  <button onClick={() => onEdit(v)} style={{ ...btnSecondary, flex: 1, padding: '7px', fontSize: '12px', textAlign: 'center' }}>Editar</button>
                  <button onClick={() => { if (confirm('¿Eliminar?')) onDelete(v.id) }}
                    style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {qrVehicle && (
        <QRModal
          title={`${qrVehicle.brand} ${qrVehicle.model}`}
          value={qrVehicle.chassisNumber || String(qrVehicle.id)}
          subtitle={`${qrVehicle.type === 'moto' ? '🏍️' : '⛵'} ${qrVehicle.year || ''}`}
          secondValue={qrVehicle.importCode || undefined}
          secondLabel="Cód. importación"
          onClose={() => setQrVehicle(null)}
        />
      )}
    </div>
  )
}
