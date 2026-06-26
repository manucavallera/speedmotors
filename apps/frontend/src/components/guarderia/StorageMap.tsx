import { type MapSpot } from '../../types/guarderia.types'

interface Props {
  spots: MapSpot[]
  selectedId: number | null
  onSelect: (spotId: number) => void
}

// Estilo por estado del lugar: libre / ocupado al día / ocupado con deuda
function spotColors(spot: MapSpot): { bg: string; border: string; code: string } {
  if (!spot.occupied) return { bg: '#f0fdf4', border: '#bbf7d0', code: '#16a34a' }
  if (spot.debt > 0) return { bg: '#fef2f2', border: '#fecaca', code: '#dc2626' }
  return { bg: '#eff6ff', border: '#bfdbfe', code: '#2563eb' }
}

export function StorageMap({ spots, selectedId, onSelect }: Props) {
  if (!spots.length) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
        Todavía no hay lugares configurados. Tocá "Configurar lugares" para crearlos.
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
      {spots.map(spot => {
        const c = spotColors(spot)
        const selected = spot.spotId === selectedId
        return (
          <button
            key={spot.spotId}
            onClick={() => onSelect(spot.spotId)}
            style={{
              textAlign: 'left', cursor: 'pointer', position: 'relative',
              background: c.bg, border: `1.5px solid ${c.border}`,
              borderRadius: '11px', padding: '11px 12px', minHeight: '78px',
              display: 'flex', flexDirection: 'column', gap: '4px',
              outline: selected ? '2px solid #f59e0b' : 'none', outlineOffset: '2px',
              transition: 'transform .08s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <span style={{ fontWeight: 700, fontSize: '15px', color: c.code }}>{spot.code}</span>
            {spot.occupied && spot.unit ? (
              <span style={{ fontSize: '11px', color: '#475569', lineHeight: 1.3, overflow: 'hidden' }}>
                {spot.unit.clientName}<br />
                <span style={{ color: '#94a3b8' }}>{spot.unit.description}</span>
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Libre</span>
            )}
            {spot.occupied && spot.debt > 0 && (
              <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', fontWeight: 700, background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '20px' }}>
                DEBE
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
