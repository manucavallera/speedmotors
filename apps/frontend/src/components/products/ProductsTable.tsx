import { useState } from 'react'
import { btnSecondary } from '../ui/FormField'
import { StockBadge, GainBadge } from './ProductBadges'

const HEADERS = ['', 'Código', 'Nombre', 'Marca', 'Costo', 'Precio venta', 'Ganancia', 'Stock', '']

function RowCarousel({ photos, onExpand }: { photos: string[]; onExpand: () => void }) {
  const [idx, setIdx] = useState(0)
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)) }
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.min(photos.length - 1, i + 1)) }
  return (
    <div style={{ position: 'relative', width: '52px', height: '52px', cursor: 'zoom-in', flexShrink: 0 }} onClick={e => { e.stopPropagation(); onExpand() }}>
      <img src={photos[idx]} alt="" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'block' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      {photos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 2px 2px' }}>
          <button onClick={prev} disabled={idx === 0}
            style={{ background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '4px', width: '16px', height: '14px', cursor: 'pointer', fontSize: '11px', padding: 0, lineHeight: 1, opacity: idx === 0 ? 0.3 : 1 }}>‹</button>
          <button onClick={next} disabled={idx === photos.length - 1}
            style={{ background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '4px', width: '16px', height: '14px', cursor: 'pointer', fontSize: '11px', padding: 0, lineHeight: 1, opacity: idx === photos.length - 1 ? 0.3 : 1 }}>›</button>
        </div>
      )}
    </div>
  )
}

function PhotoLightbox({ photos, onClose }: { photos: string[]; onClose: () => void }) {
  const [idx, setIdx] = useState(0)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '14px', padding: '12px', maxWidth: '420px', width: '90%' }}>
        <div style={{ position: 'relative' }}>
          <img src={photos[idx]} alt="" style={{ width: '100%', height: '280px', objectFit: 'contain', borderRadius: '8px', background: '#f8fafc' }} />
          {photos.length > 1 && <>
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', opacity: idx === 0 ? 0.3 : 1 }}>‹</button>
            <button onClick={() => setIdx(i => Math.min(photos.length - 1, i + 1))} disabled={idx === photos.length - 1}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', opacity: idx === photos.length - 1 ? 0.3 : 1 }}>›</button>
            <span style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{idx + 1}/{photos.length}</span>
          </>}
        </div>
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto' }}>
            {photos.map((url, i) => (
              <img key={i} src={url} onClick={() => setIdx(i)} alt=""
                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: i === idx ? '2px solid #2563eb' : '2px solid transparent', flexShrink: 0 }} />
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: '10px', width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>Cerrar</button>
      </div>
    </div>
  )
}

interface ProductsTableProps {
  sorted: any[]
  isLoading: boolean
  onEdit: (p: any) => void
  onDelete?: (id: number) => void
  onQR: (p: any) => void
}

export function ProductsTable({ sorted, isLoading, onEdit, onDelete, onQR }: ProductsTableProps) {
  const [lightbox, setLightbox] = useState<string[] | null>(null)
  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      {isLoading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {HEADERS.map((h, i) => <th key={i} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                {[44, 80, 200, 80, 80, 90, 60, 50, 80].map((w, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: `${w}px`, maxWidth: '100%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : sorted.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Sin resultados</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {HEADERS.map((h, i) => <th key={i} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p: any, i: number) => (
              <tr key={p.id} style={{ borderBottom: i < sorted.length - 1 ? '1px solid #f8fafc' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '8px 8px 8px 16px', width: '60px' }}>
                  {(() => {
                    const photos: string[] = p.photos?.length ? p.photos : p.photoUrl ? [p.photoUrl] : []
                    return photos.length ? (
                      <RowCarousel photos={photos} onExpand={() => setLightbox(photos)} />
                    ) : (
                      <div style={{ width: '52px', height: '52px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                    )
                  })()}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                  <div>{p.code}</div>
                  {p.serialNumber && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>S/N: {p.serialNumber}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: 500, color: '#0f172a', maxWidth: '240px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{p.brand || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>${Number(p.costPrice).toLocaleString('es-AR')}</td>
                <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>${Number(p.sellPrice).toLocaleString('es-AR')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <GainBadge cost={Number(p.costPrice)} sell={Number(p.sellPrice)} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <StockBadge stock={p.stock} minStock={p.minStock} />
                    {p.ingresoTipo && (
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px',
                        background: p.ingresoTipo === 'blanco' ? '#eff6ff' : '#fef9c3',
                        color: p.ingresoTipo === 'blanco' ? '#1d4ed8' : '#854d0e' }}>
                        {p.ingresoTipo === 'blanco' ? '🧾 blanco' : '🤝 negro'}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => onQR(p)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>QR</button>
                    <button onClick={() => onEdit(p)} style={{ ...btnSecondary, padding: '5px 12px', fontSize: '12px' }}>Editar</button>
                    {onDelete && <button onClick={() => { if (confirm('¿Eliminar producto?')) onDelete(p.id) }}
                      style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      Eliminar
                    </button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {lightbox && <PhotoLightbox photos={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
