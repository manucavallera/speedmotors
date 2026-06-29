import { type MapSpot } from '../../types/guarderia.types'

interface Props {
  spots: MapSpot[]
  onSelect: (spotId: number) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

// Link de WhatsApp para reclamar la deuda
function waLink(phone: string | null, msg: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const full = digits.startsWith('54') ? digits : `549${digits}`
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`
}

export function DeudoresPanel({ spots, onSelect }: Props) {
  const deudores = spots
    .filter(s => s.occupied && s.debt > 0 && s.unit)
    .sort((a, b) => b.debt - a.debt)

  if (!deudores.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>✓ Nadie debe</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Todos los lugares al día</div>
      </div>
    )
  }

  const total = deudores.reduce((a, s) => a + s.debt, 0)

  return (
    <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>Deudores ({deudores.length})</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>{fmt(total)}</span>
      </div>
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {deudores.map(s => {
          const wa = waLink(s.unit!.clientPhone, `Hola ${s.unit!.clientName}, te recordamos que tenés un saldo pendiente de ${fmt(s.debt)} en la guardería náutica.`)
          return (
            <div key={s.spotId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.unit!.clientName}</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.code} · {s.unit!.description}</div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>{fmt(s.debt)}</span>
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" title="Reclamar por WhatsApp" style={{ fontSize: '15px', textDecoration: 'none' }}>💬</a>
              )}
              <button onClick={() => onSelect(s.spotId)} style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', background: 'white', border: '1px solid #fecaca', borderRadius: '6px', padding: '3px 9px', cursor: 'pointer' }}>Cobrar</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
