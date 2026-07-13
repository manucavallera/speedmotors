import { useState } from 'react'
import { type MapSpot } from '../../types/guarderia.types'

interface Props {
  spots: MapSpot[]
  selectedId: number | null
  onSelect: (spotId: number) => void
}

// Estilo por estado de la cuna: en obra / libre / ocupada al día / ocupada con deuda
function spotColors(spot: MapSpot): { bg: string; border: string; code: string } {
  if (!spot.active) return { bg: '#f8fafc', border: '#e2e8f0', code: '#cbd5e1' }
  if (!spot.occupied) return { bg: '#f0fdf4', border: '#bbf7d0', code: '#16a34a' }
  if (spot.debt > 0) return { bg: '#fef2f2', border: '#fecaca', code: '#dc2626' }
  return { bg: '#eff6ff', border: '#bfdbfe', code: '#2563eb' }
}

function SpotCell({ spot, selected, onSelect }: { spot: MapSpot; selected: boolean; onSelect: (id: number) => void }) {
  const c = spotColors(spot)
  return (
    <button
      onClick={() => onSelect(spot.spotId)}
      style={{
        textAlign: 'left', cursor: 'pointer', position: 'relative',
        background: c.bg, border: `1.5px solid ${c.border}`,
        borderRadius: '11px', padding: '11px 12px', minHeight: '78px',
        display: 'flex', flexDirection: 'column', gap: '4px',
        outline: selected ? '2px solid #f59e0b' : 'none', outlineOffset: '2px',
        opacity: spot.active ? 1 : 0.6, transition: 'transform .08s',
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
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{spot.active ? 'Libre' : 'En obra'}</span>
      )}
      {spot.occupied && spot.debt > 0 && (
        <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', fontWeight: 700, background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '20px' }}>
          DEBE
        </span>
      )}
    </button>
  )
}

// Una línea del galpón (A/B/C/D) con sus 48 cunas. Las líneas en obra arrancan plegadas.
function LineSection({ line, spots, selectedId, onSelect }: { line: string } & Props) {
  const operativa = spots.some(s => s.active)
  const [open, setOpen] = useState(operativa)
  const ocupadas = spots.filter(s => s.occupied).length

  return (
    <div style={{ marginBottom: '18px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
          background: 'none', border: 'none', padding: '0 0 8px', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Línea {line}</span>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {operativa ? `${ocupadas}/${spots.length} ocupadas` : `${spots.length} cunas · sin piso todavía`}
        </span>
        {!operativa && (
          <span style={{ fontSize: '9px', fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '3px 7px', borderRadius: '20px' }}>
            EN OBRA
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
          {spots.map(s => (
            <SpotCell key={s.spotId} spot={s} selected={s.spotId === selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

export function StorageMap({ spots, selectedId, onSelect }: Props) {
  if (!spots.length) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
        Todavía no hay cunas configuradas. Tocá "Configurar lugares" para crearlas.
      </div>
    )
  }

  // El galpón está dividido en líneas: cada una es un estante con sus cunas numeradas
  const lines = [...new Set(spots.map(s => s.line))].sort()

  return (
    <div>
      {lines.map(line => (
        <LineSection
          key={line}
          line={line}
          spots={spots.filter(s => s.line === line)}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
