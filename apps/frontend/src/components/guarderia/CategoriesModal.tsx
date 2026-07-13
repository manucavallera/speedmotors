import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { toast } from '../../lib/toast'
import { type StorageCategory, type CategoryForm } from '../../types/guarderia.types'

interface Props {
  categories: StorageCategory[]
  submitting: boolean
  onClose: () => void
  onCreate: (data: CategoryForm) => void
  onUpdate: (id: number, data: CategoryForm) => void
  onRemove: (id: number) => void
}

const EMPTY: CategoryForm = { name: '', minHp: undefined, maxHp: undefined, minLength: undefined, maxLength: undefined, monthlyRate: 0 }

// Escala legible: "2 a 35 HP · hasta 5.5 m"
function scaleLabel(c: StorageCategory) {
  const parts: string[] = []
  if (c.minHp != null || c.maxHp != null) parts.push(`${c.minHp ?? 0} a ${c.maxHp ?? '∞'} HP`)
  if (c.minLength != null || c.maxLength != null) parts.push(`${Number(c.minLength ?? 0)} a ${c.maxLength != null ? Number(c.maxLength) : '∞'} m`)
  return parts.join(' · ') || 'Sin escala'
}

export function CategoriesModal({ categories, submitting, onClose, onCreate, onUpdate, onRemove }: Props) {
  const [f, setF] = useState<CategoryForm>(EMPTY)
  const [editing, setEditing] = useState<number | null>(null)

  const num = (v: string) => (v === '' ? undefined : Number(v))

  function submit() {
    if (!f.name.trim()) { toast.error('Poné un nombre (ej: Chica 2-35 HP)'); return }
    if (editing) onUpdate(editing, f)
    else onCreate(f)
    setF(EMPTY); setEditing(null)
  }

  function edit(c: StorageCategory) {
    setEditing(c.id)
    setF({
      name: c.name,
      minHp: c.minHp ?? undefined,
      maxHp: c.maxHp ?? undefined,
      minLength: c.minLength != null ? Number(c.minLength) : undefined,
      maxLength: c.maxLength != null ? Number(c.maxLength) : undefined,
      monthlyRate: Number(c.monthlyRate),
    })
  }

  return (
    <Modal title="Categorías y tarifas" onClose={onClose}>
      <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px' }}>
        La categoría define la tarifa mensual de la cuna según los HP del motor y el largo de la lancha.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
        {categories.length === 0 && (
          <div style={{ padding: '18px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1.5px dashed #e2e8f0', borderRadius: '10px' }}>
            Todavía no hay categorías cargadas.
          </div>
        )}
        {categories.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.name}</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{scaleLabel(c)}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', whiteSpace: 'nowrap' }}>
              ${Number(c.monthlyRate).toLocaleString('es-AR')}
            </div>
            <button style={{ ...btnSecondary, padding: '6px 10px' }} onClick={() => edit(c)}>Editar</button>
            <button style={{ ...btnSecondary, padding: '6px 10px', color: '#dc2626' }} onClick={() => onRemove(c.id)}>Borrar</button>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
          {editing ? 'Editar categoría' : 'Nueva categoría'}
        </div>
        <input style={inputStyle} placeholder="Nombre (ej: Chica 2-35 HP)" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={inputStyle} type="number" placeholder="HP desde" value={f.minHp ?? ''} onChange={e => setF({ ...f, minHp: num(e.target.value) })} />
          <input style={inputStyle} type="number" placeholder="HP hasta" value={f.maxHp ?? ''} onChange={e => setF({ ...f, maxHp: num(e.target.value) })} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={inputStyle} type="number" step="0.1" placeholder="Largo desde (m)" value={f.minLength ?? ''} onChange={e => setF({ ...f, minLength: num(e.target.value) })} />
          <input style={inputStyle} type="number" step="0.1" placeholder="Largo hasta (m)" value={f.maxLength ?? ''} onChange={e => setF({ ...f, maxLength: num(e.target.value) })} />
        </div>
        <input style={inputStyle} type="number" placeholder="Tarifa mensual $" value={f.monthlyRate ?? ''} onChange={e => setF({ ...f, monthlyRate: num(e.target.value) })} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {editing && <button style={btnSecondary} onClick={() => { setF(EMPTY); setEditing(null) }}>Cancelar</button>}
          <button style={btnPrimary} disabled={submitting} onClick={submit}>
            {editing ? 'Guardar cambios' : 'Agregar categoría'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
