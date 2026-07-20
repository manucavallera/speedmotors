import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { type UnitDetail, type StorageCategory, type UpdateUnitForm } from '../../types/guarderia.types'

interface Props {
  unit: UnitDetail
  categories: StorageCategory[]
  onClose: () => void
  onSubmit: (data: UpdateUnitForm) => void
  submitting: boolean
}

// Editar datos de una lancha ya cargada. No toca cliente ni cuna (eso va por Mover).
export function EditUnitModal({ unit, categories, onClose, onSubmit, submitting }: Props) {
  const [description, setDescription] = useState(unit.description)
  const [categoryId, setCategoryId] = useState(unit.categoryId != null ? String(unit.categoryId) : '')
  const [hp, setHp] = useState(unit.hp != null ? String(unit.hp) : '')
  const [lengthM, setLengthM] = useState(unit.lengthM != null ? String(Number(unit.lengthM)) : '')
  const [rate, setRate] = useState(String(Number(unit.rate)))
  const [notes, setNotes] = useState(unit.notes ?? '')

  // Al cambiar de categoría, sugiere su tarifa mensual (se puede pisar)
  function pickCategory(id: string) {
    setCategoryId(id)
    const cat = categories.find(c => String(c.id) === id)
    if (cat) setRate(String(Number(cat.monthlyRate)))
  }

  function submit() {
    if (!description.trim()) { toast.error('Describí la embarcación'); return }
    onSubmit({
      description: description.trim(),
      categoryId: categoryId ? Number(categoryId) : null,
      hp: hp ? Number(hp) : null,
      lengthM: lengthM ? Number(lengthM) : null,
      rate: rate ? Number(rate) : 0,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Modal title="Editar embarcación" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Embarcación / vehículo">
          <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <FormField label="HP del motor">
              <input style={inputStyle} type="number" placeholder="Ej: 60" value={hp} onChange={e => setHp(e.target.value)} />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Largo (m)">
              <input style={inputStyle} type="number" step="0.1" placeholder="Ej: 5.4" value={lengthM} onChange={e => setLengthM(e.target.value)} />
            </FormField>
          </div>
        </div>

        <FormField label="Categoría">
          <select style={inputStyle} value={categoryId} onChange={e => pickCategory(e.target.value)}>
            <option value="">— Sin categoría —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name} · ${Number(c.monthlyRate).toLocaleString('es-AR')}/mes</option>
            ))}
          </select>
        </FormField>

        <FormField label="Tarifa mensual">
          <input style={inputStyle} type="number" placeholder="0" value={rate} onChange={e => setRate(e.target.value)} />
        </FormField>

        <FormField label="Notas">
          <input style={inputStyle} placeholder="Opcional" value={notes} onChange={e => setNotes(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} disabled={submitting} onClick={submit}>Guardar cambios</button>
        </div>
      </div>
    </Modal>
  )
}
