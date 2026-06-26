import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

interface Props {
  onClose: () => void
  onSubmit: (codes: string[]) => void
  submitting: boolean
}

export function SetupModal({ onClose, onSubmit, submitting }: Props) {
  const [prefix, setPrefix] = useState('A')
  const [count, setCount] = useState('10')
  const [raw, setRaw] = useState('')

  // Genera A1..A10 y los agrega al textarea
  function generate() {
    const n = Number(count)
    if (!prefix.trim() || !n || n <= 0) { toast.error('Completá prefijo y cantidad'); return }
    const codes = Array.from({ length: n }, (_, i) => `${prefix.trim().toUpperCase()}${i + 1}`)
    setRaw(prev => (prev.trim() ? prev.trim() + ' ' : '') + codes.join(' '))
  }

  function submit() {
    const codes = raw.split(/[\s,]+/).map(c => c.trim().toUpperCase()).filter(Boolean)
    if (!codes.length) { toast.error('No hay lugares para crear'); return }
    onSubmit(Array.from(new Set(codes)))
  }

  return (
    <Modal title="Configurar lugares" onClose={onClose} width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Generá lugares en lote o escribilos a mano. Los que ya existan se ignoran.
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <FormField label="Prefijo">
              <input style={inputStyle} value={prefix} onChange={e => setPrefix(e.target.value)} />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Cantidad">
              <input style={inputStyle} type="number" value={count} onChange={e => setCount(e.target.value)} />
            </FormField>
          </div>
          <button style={btnSecondary} onClick={generate}>Generar</button>
        </div>

        <FormField label="Lugares (separados por espacio o coma)">
          <textarea
            style={{ ...inputStyle, minHeight: '90px', resize: 'vertical', fontFamily: 'monospace' }}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder="A1 A2 A3 B1 B2..."
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} disabled={submitting} onClick={submit}>Crear lugares</button>
        </div>
      </div>
    </Modal>
  )
}
