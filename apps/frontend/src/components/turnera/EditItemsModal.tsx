import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { type RentalSlot, type SlotItemForm } from '../../types/turnera.types'
import { type StorageService } from '../../types/guarderia.types'

interface Props {
  slot: RentalSlot
  services: StorageService[]
  onClose: () => void
  onSubmit: (items: SlotItemForm[]) => void
  submitting: boolean
}

// Editar los servicios de un turno ya reservado: agregar/quitar batería, combustible, etc.
export function EditItemsModal({ slot, services, onClose, onSubmit, submitting }: Props) {
  // La "Salida al agua" (sin serviceId) va como precio base editable; el resto son servicios del catálogo
  const [launch, setLaunch] = useState<number>(
    Number(slot.items.find(i => i.serviceId == null && i.concept === 'Salida al agua')?.amount ?? 0),
  )
  const [picked, setPicked] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {}
    for (const it of slot.items) if (it.serviceId != null) init[it.serviceId] = Number(it.amount)
    return init
  })

  const total = launch + Object.values(picked).reduce((a, b) => a + b, 0)

  function toggle(s: StorageService) {
    setPicked(prev => {
      const next = { ...prev }
      if (s.id in next) delete next[s.id]
      else next[s.id] = Number(s.price) || 0
      return next
    })
  }

  function submit() {
    onSubmit([
      ...(launch > 0 ? [{ concept: 'Salida al agua', amount: launch }] : []),
      ...Object.entries(picked).map(([id, amount]) => ({
        serviceId: Number(id),
        concept: services.find(s => s.id === Number(id))?.name ?? 'Servicio',
        amount,
      })),
    ])
  }

  return (
    <Modal title="Editar servicios del turno" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
          {slot.startTime}–{slot.endTime} · {slot.boatName ?? 'lancha'} · {slot.clientName ?? 'sin cliente'}
        </div>

        <FormField label="Salida al agua">
          <input style={inputStyle} type="number" value={launch} onChange={e => setLaunch(Number(e.target.value) || 0)} placeholder="Precio de la salida" />
        </FormField>

        <FormField label="Servicios que pide">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '210px', overflowY: 'auto' }}>
            {services.map(s => {
              const on = s.id in picked
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    background: on ? '#eff6ff' : '#f8fafc',
                    border: `1.5px solid ${on ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: '9px', padding: '8px 11px',
                  }}
                >
                  <input type="checkbox" checked={on} readOnly style={{ pointerEvents: 'none' }} />
                  <span style={{ flex: 1, fontSize: '13px', color: '#0f172a' }}>{s.name}</span>
                  {on ? (
                    <input
                      style={{ ...inputStyle, width: '95px', padding: '4px 8px', fontSize: '12.5px' }}
                      type="number"
                      value={picked[s.id]}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setPicked(p => ({ ...p, [s.id]: Number(e.target.value) || 0 }))}
                    />
                  ) : (
                    <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>${Number(s.price).toLocaleString('es-AR')}</span>
                  )}
                </div>
              )
            })}
          </div>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Total del turno</span>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>${total.toLocaleString('es-AR')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} disabled={submitting} onClick={submit}>Guardar</button>
        </div>
      </div>
    </Modal>
  )
}
