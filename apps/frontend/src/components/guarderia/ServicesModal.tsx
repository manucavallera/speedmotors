import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { MoneyInput } from '../ui/MoneyInput'
import { type StorageService, type ServiceForm } from '../../types/guarderia.types'

interface Props {
  services: StorageService[]
  onClose: () => void
  onCreate: (data: ServiceForm) => void
  onUpdate: (id: number, data: ServiceForm) => void
  onRemove: (id: number) => void
  submitting: boolean
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

const tagStyle = (bg: string, border: string, color: string): React.CSSProperties => ({
  background: bg, border: `1px solid ${border}`, color,
  borderRadius: '6px', padding: '1px 6px', fontSize: '10.5px', fontWeight: 600,
})

export function ServicesModal({ services, onClose, onCreate, onUpdate, onRemove, submitting }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  // Dónde se cobra el servicio: con la cuna del mes y/o al reservar un turno
  const [forUnit, setForUnit] = useState(true)
  const [forSlot, setForSlot] = useState(true)

  function reset() { setEditingId(null); setName(''); setPrice(''); setForUnit(true); setForSlot(true) }
  function startEdit(s: StorageService) {
    setEditingId(s.id); setName(s.name); setPrice(s.price)
    setForUnit(s.forUnit); setForSlot(s.forSlot)
  }

  function submit() {
    if (!name.trim()) { toast.error('Nombre requerido'); return }
    if (!forUnit && !forSlot) { toast.error('Marcá al menos dónde se cobra, si no el servicio no aparece en ningún lado'); return }
    const data: ServiceForm = { name: name.trim(), price: price ? Number(price) : 0, forUnit, forSlot }
    if (editingId) onUpdate(editingId, data)
    else onCreate(data)
    reset()
  }

  return (
    <Modal title="Servicios anexos" onClose={onClose} width={500}>
      <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '12px' }}>
        Seguro, lavado, puesta en marcha, alquiler batería, etc. Cada uno se cobra donde lo marques.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '8px', alignItems: 'end', marginBottom: '10px' }}>
        <input style={inputStyle} placeholder="Nombre del servicio" value={name} onChange={e => setName(e.target.value)} />
        <MoneyInput value={price} onChange={setPrice} placeholder="Precio" />
        <button style={btnPrimary} disabled={submitting} onClick={submit}>{editingId ? 'Guardar' : '+ Agregar'}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
          <input type="checkbox" checked={forUnit} onChange={e => setForUnit(e.target.checked)} />
          Se adhiere a la lancha <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>— se cobra todos los meses con la cuna</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
          <input type="checkbox" checked={forSlot} onChange={e => setForSlot(e.target.checked)} />
          Se ofrece en el turno <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>— se cobra en esa salida al agua</span>
        </label>
      </div>
      {editingId && <button style={{ ...btnSecondary, marginBottom: '12px' }} onClick={reset}>Cancelar edición</button>}

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {!services.length && <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin servicios todavía</div>}
        {services.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
              <div style={{ color: '#94a3b8', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {fmt(Number(s.price))}
                {s.forUnit && <span style={tagStyle('#eff6ff', '#bfdbfe', '#1d4ed8')}>mensual</span>}
                {s.forSlot && <span style={tagStyle('#ecfdf5', '#a7f3d0', '#047857')}>por turno</span>}
              </div>
            </div>
            <button onClick={() => startEdit(s)} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Editar</button>
            <button onClick={() => { if (window.confirm(`¿Eliminar ${s.name}?`)) onRemove(s.id) }} style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}>Eliminar</button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
