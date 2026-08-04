import { useState } from 'react'
import { QRModal } from '../ui/QRModal'
import { btnSecondary } from '../ui/FormField'

function PhotoLightbox({ photos, onClose }: { photos: string[]; onClose: () => void }) {
  const [idx, setIdx] = useState(0)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '12px', maxWidth: '480px', width: '92%' }}>
        <div style={{ position: 'relative' }}>
          <img src={photos[idx]} alt="" style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: '10px', background: '#f8fafc', display: 'block' }} />
          {photos.length > 1 && <>
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '20px', opacity: idx === 0 ? 0.3 : 1 }}>‹</button>
            <button onClick={() => setIdx(i => Math.min(photos.length - 1, i + 1))} disabled={idx === photos.length - 1}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '20px', opacity: idx === photos.length - 1 ? 0.3 : 1 }}>›</button>
            <span style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{idx + 1}/{photos.length}</span>
          </>}
        </div>
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto' }}>
            {photos.map((url, i) => (
              <img key={i} src={url} onClick={() => setIdx(i)} alt=""
                style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '7px', cursor: 'pointer', border: i === idx ? '2px solid #2563eb' : '2px solid transparent', flexShrink: 0 }} />
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: '10px', width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>Cerrar</button>
      </div>
    </div>
  )
}

function CardCarousel({ photos, onExpand }: { photos: string[]; onExpand: (photos: string[]) => void }) {
  const [idx, setIdx] = useState(0)
  if (!photos.length) return null
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)) }
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.min(photos.length - 1, i + 1)) }
  return (
    <div style={{ position: 'relative', height: '150px', background: '#f8fafc', cursor: 'zoom-in' }} onClick={() => onExpand(photos)}>
      <img src={photos[idx]} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      {photos.length > 1 && (
        <>
          {idx > 0 && <button onClick={prev}
            style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>}
          {idx < photos.length - 1 && <button onClick={next}
            style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>}
          <span style={{ position: 'absolute', bottom: '6px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>{idx + 1}/{photos.length}</span>
        </>
      )}
    </div>
  )
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  disponible: { bg: '#f0fdf4', color: '#16a34a', label: 'Disponible' },
  reservado:  { bg: '#fffbeb', color: '#d97706', label: 'Reservado' },
  vendido:    { bg: '#f1f5f9', color: '#64748b', label: 'Vendido' },
}

interface VehiclesGridProps {
  vehicles: any[]
  isLoading: boolean
  onEdit: (v: any) => void
  onDelete?: (id: number) => void
}

export function VehiclesGrid({ vehicles, isLoading, onEdit, onDelete }: VehiclesGridProps) {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [lightbox, setLightbox] = useState<string[] | null>(null)
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | ''>('')
  const [ingresoFilter, setIngresoFilter] = useState<'blanco' | 'negro' | ''>('')
  const [qrVehicle, setQrVehicle] = useState<any>(null)
  const [internalQrVehicle, setInternalQrVehicle] = useState<any>(null)

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

  const label = (text: string) => (
    <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{text}</span>
  )

  return (
    <div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {label('Tipo')}
          <div style={{ display: 'flex', gap: '6px' }}>
            {([['', 'Todos'], ['moto', '🏍️ Motos'], ['lancha', '⛵ Lanchas']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setTypeFilter(val)} style={btnFilter(typeFilter === val)}>{lbl}</button>
            ))}
          </div>
        </div>

        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {label('Estado')}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([['', 'Todos'], ['disponible', 'Disponible'], ['reservado', 'Reservado'], ['vendido', 'Vendido']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setStatusFilter(val)} style={btnFilterDark(statusFilter === val)}>{lbl}</button>
            ))}
          </div>
        </div>

        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {label('Ingreso')}
          <div style={{ display: 'flex', gap: '6px' }}>
            {([['', 'Todos'], ['blanco', '🧾 Blanco'], ['negro', '🤝 Negro']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setIngresoFilter(val as 'blanco' | 'negro' | '')} style={btnFilterDark(ingresoFilter === val)}>{lbl}</button>
            ))}
          </div>
        </div>

        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {label('Precio')}
          <div style={{ display: 'flex', gap: '6px' }}>
            {([['', 'Sin orden'], ['asc', '↑ Menor'], ['desc', '↓ Mayor']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setPriceSort(val as 'asc' | 'desc' | '')} style={btnFilter(priceSort === val)}>{lbl}</button>
            ))}
          </div>
        </div>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {sorted.map((v: any) => {
            const st = statusColors[v.status] || statusColors.disponible
            return (
              <div key={v.id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                {v.photos?.length > 0 && (
                  <CardCarousel photos={v.photos} onExpand={setLightbox} />
                )}
                <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px' }}>{v.type === 'moto' ? '🏍️' : '⛵'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{v.brand} {v.model}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {v.displacement ? `${v.displacement} cc` : '—'}{v.version ? ` · ${v.version}` : ''} · {v.color || '—'}
                      </div>
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                {v.chassisNumber && (
                  <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '7px', marginBottom: '6px', fontFamily: 'monospace' }}>
                    Chasis: {v.chassisNumber}
                  </div>
                )}
                {v.engineNumber && (
                  <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '7px', marginBottom: '6px', fontFamily: 'monospace' }}>
                    Motor: {v.engineNumber}
                  </div>
                )}
                {v.internalCode && (
                  <div style={{ fontSize: '12px', color: '#0369a1', background: '#f0f9ff', padding: '6px 10px', borderRadius: '7px', marginBottom: '6px', fontFamily: 'monospace', fontWeight: 600 }}>
                    Código interno: {v.internalCode}
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setQrVehicle(v)} style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>QR</button>
                  {v.internalCode && <button onClick={() => setInternalQrVehicle(v)} style={{ flex: 1, minWidth: '86px', padding: '7px', fontSize: '12px', fontWeight: 600, background: '#f0f9ff', color: '#0369a1', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>QR interno</button>}
                  <button onClick={() => onEdit(v)} style={{ ...btnSecondary, flex: 1, padding: '7px', fontSize: '12px', textAlign: 'center' }}>Editar</button>
                  {onDelete && <button onClick={() => { if (confirm('¿Eliminar?')) onDelete(v.id) }}
                    style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Eliminar
                  </button>}
                </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lightbox && <PhotoLightbox photos={lightbox} onClose={() => setLightbox(null)} />}

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

      {internalQrVehicle && (
        <QRModal
          title={`${internalQrVehicle.brand} ${internalQrVehicle.model}`}
          value={internalQrVehicle.internalCode}
          valueLabel="Código interno"
          subtitle={`${internalQrVehicle.displacement ? `${internalQrVehicle.displacement} cc · ` : ''}${internalQrVehicle.color || ''}`}
          onClose={() => setInternalQrVehicle(null)}
        />
      )}
    </div>
  )
}
