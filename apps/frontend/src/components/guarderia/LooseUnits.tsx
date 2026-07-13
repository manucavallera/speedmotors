import { type UnitRow } from '../../types/guarderia.types'

interface Props {
  units: UnitRow[]
  onCobrar: (unitId: number) => void
  onAsignar: (unit: UnitRow) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

// Lanchas que están sobre trailer, sueltas en el galpón, sin cuna asignada
export function LooseUnits({ units, onCobrar, onAsignar }: Props) {
  if (!units.length) return null

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Sobre trailer</span>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{units.length} sin cuna</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {units.map(u => (
          <div
            key={u.id}
            style={{
              background: u.debt > 0 ? '#fef2f2' : '#fffbeb',
              border: `1.5px solid ${u.debt > 0 ? '#fecaca' : '#fde68a'}`,
              borderRadius: '11px', padding: '11px 12px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{u.clientName ?? '—'}</div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.3 }}>
              {u.description}
              {u.hp != null && ` · ${u.hp} HP`}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: u.debt > 0 ? '#dc2626' : '#16a34a' }}>
              {u.debt > 0 ? `Debe ${fmt(u.debt)}` : 'Al día'}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <button
                onClick={() => onCobrar(u.id)}
                style={{ flex: 1, fontSize: '11.5px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', padding: '5px', cursor: 'pointer' }}
              >Cobrar</button>
              <button
                onClick={() => onAsignar(u)}
                style={{ flex: 1, fontSize: '11.5px', fontWeight: 600, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '5px', cursor: 'pointer' }}
              >Dar cuna</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
