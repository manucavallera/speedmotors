import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

interface ReservationFormModalProps {
  mode: 'new' | 'edit'
  editing?: any
  clients: any[]
  onClose: () => void
  onSubmit: (data: any) => void
  isPending: boolean
}

function toForm(r?: any) {
  return {
    date: r?.date ? new Date(r.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    clientId: r?.clientId ? String(r.clientId) : '',
    clientName: r?.clientName || '',
    clientDni: r?.clientDni || '',
    clientAddress: r?.clientAddress || '',
    clientPhone: r?.clientPhone || '',
    spouseName: r?.spouseName || '',
    spouseDni: r?.spouseDni || '',
    vehicleType: r?.vehicleType || 'moto',
    brand: r?.brand || '',
    model: r?.model || '',
    year: r?.year ? String(r.year) : '',
    color: r?.color || '',
    motorNumber: r?.motorNumber || '',
    chassisNumber: r?.chassisNumber || '',
    price: r?.price ? String(Number(r.price)) : '',
    depositAmount: r?.depositAmount ? String(Number(r.depositAmount)) : '',
    notes: r?.notes || '',
  }
}

export function ReservationFormModal({ mode, editing, clients, onClose, onSubmit, isPending }: ReservationFormModalProps) {
  const [f, setF] = useState(toForm(editing))

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  function fillFromClient(clientId: string) {
    const c = clients.find((cl: any) => String(cl.id) === clientId)
    setF(prev => ({
      ...prev,
      clientId,
      clientName: c?.name || prev.clientName,
      clientDni: c?.dni || prev.clientDni,
      clientAddress: c?.address || prev.clientAddress,
      clientPhone: c?.phone || prev.clientPhone,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      date: f.date,
      clientId: f.clientId ? Number(f.clientId) : undefined,
      clientName: f.clientName,
      clientDni: f.clientDni || undefined,
      clientAddress: f.clientAddress || undefined,
      clientPhone: f.clientPhone || undefined,
      spouseName: f.spouseName || undefined,
      spouseDni: f.spouseDni || undefined,
      vehicleType: f.vehicleType,
      brand: f.brand,
      model: f.model || undefined,
      year: f.year ? Number(f.year) : undefined,
      color: f.color || undefined,
      motorNumber: f.motorNumber || undefined,
      chassisNumber: f.chassisNumber || undefined,
      price: f.price ? Number(f.price) : undefined,
      depositAmount: f.depositAmount ? Number(f.depositAmount) : undefined,
      notes: f.notes || undefined,
    })
  }

  const saldo = (Number(f.price) || 0) - (Number(f.depositAmount) || 0)

  return (
    <Modal title={mode === 'edit' ? 'Editar reserva' : 'Nueva solicitud de reserva'} onClose={onClose} width={660}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Fecha */}
        <FormField label="Fecha de reserva">
          <input type="date" style={{ ...inputStyle, width: '180px' }} value={f.date} onChange={set('date')} />
        </FormField>

        {/* COMPRADOR */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.5px' }}>
          DATOS DEL COMPRADOR
        </div>
        <FormField label="Cliente (vincular existente)">
          <select style={inputStyle} value={f.clientId} onChange={e => fillFromClient(e.target.value)}>
            <option value="">Sin vincular / ingreso manual</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <div className="form-grid-2">
          <FormField label="Apellido y Nombre *">
            <input style={inputStyle} value={f.clientName} onChange={set('clientName')} required />
          </FormField>
          <FormField label="DNI / CUIL">
            <input style={inputStyle} value={f.clientDni} onChange={set('clientDni')} />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Domicilio">
            <input style={inputStyle} value={f.clientAddress} onChange={set('clientAddress')} />
          </FormField>
          <FormField label="Teléfono">
            <input style={inputStyle} value={f.clientPhone} onChange={set('clientPhone')} />
          </FormField>
        </div>

        {/* CÓNYUGE */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.5px' }}>
          DATOS DEL CÓNYUGE
        </div>
        <div className="form-grid-2">
          <FormField label="Apellido y Nombre">
            <input style={inputStyle} value={f.spouseName} onChange={set('spouseName')} />
          </FormField>
          <FormField label="DNI / CUIL">
            <input style={inputStyle} value={f.spouseDni} onChange={set('spouseDni')} />
          </FormField>
        </div>

        {/* VEHÍCULO */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.5px' }}>
          DATOS DEL VEHÍCULO
        </div>
        <div className="form-grid-2">
          <FormField label="Tipo *">
            <select style={inputStyle} value={f.vehicleType} onChange={set('vehicleType')}>
              <option value="moto">Motocicleta</option>
              <option value="lancha">Lancha / Embarcación</option>
            </select>
          </FormField>
          <FormField label="Marca *">
            <input style={inputStyle} value={f.brand} onChange={set('brand')} required />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Modelo">
            <input style={inputStyle} value={f.model} onChange={set('model')} />
          </FormField>
          <FormField label="Año">
            <input style={inputStyle} type="number" min="1980" max="2030" value={f.year} onChange={set('year')} />
          </FormField>
        </div>
        <FormField label="Color">
          <input style={{ ...inputStyle, width: '220px' }} value={f.color} onChange={set('color')} />
        </FormField>
        <div className="form-grid-2">
          <FormField label="Número de Motor">
            <input style={inputStyle} value={f.motorNumber} onChange={set('motorNumber')} />
          </FormField>
          <FormField label="Número de Chasis">
            <input style={inputStyle} value={f.chassisNumber} onChange={set('chassisNumber')} />
          </FormField>
        </div>

        {/* CONDICIONES */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.5px' }}>
          CONDICIONES ECONÓMICAS
        </div>
        <div className="form-grid-2">
          <FormField label="Precio pactado ($)">
            <input style={inputStyle} type="number" min="0" value={f.price} onChange={set('price')} />
          </FormField>
          <FormField label="Seña / Entrega ($)">
            <input style={inputStyle} type="number" min="0" value={f.depositAmount} onChange={set('depositAmount')} />
          </FormField>
        </div>
        {(Number(f.price) > 0 || Number(f.depositAmount) > 0) && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>PRECIO</div><div style={{ fontWeight: 700, color: '#0f172a' }}>${(Number(f.price) || 0).toLocaleString('es-AR')}</div></div>
            <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>SEÑA</div><div style={{ fontWeight: 700, color: '#16a34a' }}>${(Number(f.depositAmount) || 0).toLocaleString('es-AR')}</div></div>
            <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>SALDO</div><div style={{ fontWeight: 700, color: '#dc2626' }}>${saldo > 0 ? saldo.toLocaleString('es-AR') : '—'}</div></div>
          </div>
        )}

        <FormField label="Observaciones">
          <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={f.notes} onChange={set('notes')} />
        </FormField>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear reserva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
