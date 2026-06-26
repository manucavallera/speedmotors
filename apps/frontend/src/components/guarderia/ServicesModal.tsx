import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
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

export function ServicesModal({ services, onClose, onCreate, onUpdate, onRemove, submitting }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  function reset() { setEditingId(null); setName(''); setPrice('') }
  function startEdit(s: StorageService) { setEditingId(s.id); setName(s.name); setPrice(s.price) }

  function submit() {
    if (!name.trim()) { toast.error('Nombre requerido'); return }
    const data: ServiceForm = { name: name.trim(), price: price ? Number(price) : 0 }
    if (editingId) onUpdate(editingId, data)
    else onCreate(data)
    reset()
  }

  return (
    <Modal title="Servicios anexos" onClose={onClose} width={500}>
      <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '12px' }}>
        Seguro, lavado, puesta en marcha, alquiler batería, etc. Se suman al cobro de cada cuna.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '8px', alignItems: 'end', marginBottom: '14px' }}>
        <input style={inputStyle} placeholder="Nombre del servicio" value={name} onChange={e => setName(e.target.value)} />
        <input style={inputStyle} type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} />
        <button style={btnPrimary} disabled={submitting} onClick={submit}>{editingId ? 'Guardar' : '+ Agregar'}</button>
      </div>
      {editingId && <button style={{ ...btnSecondary, marginBottom: '12px' }} onClick={reset}>Cancelar edición</button>}

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {!services.length && <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin servicios todavía</div>}
        {services.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
              <div style={{ color: '#94a3b8', fontSize: '11.5px' }}>{fmt(Number(s.price))}</div>
            </div>
            <button onClick={() => startEdit(s)} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Editar</button>
            <button onClick={() => { if (window.confirm(`¿Eliminar ${s.name}?`)) onRemove(s.id) }} style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}>Eliminar</button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
