import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import type { Reminder, CreateReminderData } from '../../hooks/useAlerts'

interface Props {
  mode: 'new' | 'edit'
  editing?: Reminder | null
  onClose: () => void
  onSubmit: (data: Partial<CreateReminderData>) => void
  isPending: boolean
}

const defaultForm = {
  type: 'otro' as const,
  title: '',
  description: '',
  dueDate: new Date().toISOString().slice(0, 10),
  amount: '',
  recurrence: 'ninguna' as const,
}

function toForm(r?: Reminder | null) {
  if (!r) return defaultForm
  return {
    type: r.type,
    title: r.title,
    description: r.description || '',
    dueDate: new Date(r.dueDate).toISOString().slice(0, 10),
    amount: r.amount ? String(Number(r.amount)) : '',
    recurrence: r.recurrence,
  }
}

export function ReminderFormModal({ mode, editing, onClose, onSubmit, isPending }: Props) {
  const [f, setF] = useState(toForm(editing))
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      type: f.type,
      title: f.title,
      description: f.description || undefined,
      dueDate: f.dueDate,
      amount: f.amount ? Number(f.amount) : undefined,
      recurrence: f.recurrence,
    })
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar recordatorio' : 'Nuevo recordatorio'} onClose={onClose} width={500}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="form-grid-2">
          <FormField label="Tipo *">
            <select style={inputStyle} value={f.type} onChange={set('type')}>
              <option value="impuesto">Impuesto</option>
              <option value="factura">Factura</option>
              <option value="vencimiento">Vencimiento</option>
              <option value="otro">Otro</option>
            </select>
          </FormField>
          <FormField label="Repetición">
            <select style={inputStyle} value={f.recurrence} onChange={set('recurrence')}>
              <option value="ninguna">Sin repetición</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </FormField>
        </div>

        <FormField label="Título *">
          <input style={inputStyle} value={f.title} onChange={set('title')} required placeholder="Ej: Monotributo, Factura proveedor..." />
        </FormField>

        <div className="form-grid-2">
          <FormField label="Fecha de vencimiento *">
            <input type="date" style={inputStyle} value={f.dueDate} onChange={set('dueDate')} required />
          </FormField>
          <FormField label="Monto ($)">
            <input type="number" min="0" style={inputStyle} value={f.amount} onChange={set('amount')} placeholder="Opcional" />
          </FormField>
        </div>

        <FormField label="Descripción">
          <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={f.description} onChange={set('description')} placeholder="Notas adicionales..." />
        </FormField>

        {f.recurrence !== 'ninguna' && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px', color: '#0284c7' }}>
            Al marcar como pagado se creará automáticamente el siguiente vencimiento ({f.recurrence}).
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear recordatorio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
