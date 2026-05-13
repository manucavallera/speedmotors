import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'

interface ReservationFormModalProps {
  mode: 'new' | 'edit'
  editing?: any
  clients: any[]
  onClose: () => void
  onSubmit: (data: any) => void
  isPending: boolean
}

const sectionStyle = { fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.5px' }

function toForm(r?: any) {
  return {
    date: r?.date ? new Date(r.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    clientId: r?.clientId ? String(r.clientId) : '',
    clientName: r?.clientName || '',
    clientDni: r?.clientDni || '',
    clientBirthDate: r?.clientBirthDate || '',
    clientPhone: r?.clientPhone || '',
    clientEmail: r?.clientEmail || '',
    clientAddress: r?.clientAddress || '',
    clientLocality: r?.clientLocality || '',
    clientZip: r?.clientZip || '',
    clientProvince: r?.clientProvince || '',
    clientOccupation: r?.clientOccupation || '',
    patentingName: r?.patentingName || '',
    spouseName: r?.spouseName || '',
    spouseDni: r?.spouseDni || '',
    vehicleType: r?.vehicleType || 'moto',
    requestedUnit: r?.requestedUnit || '',
    brand: r?.brand || '',
    model: r?.model || '',
    year: r?.year ? String(r.year) : '',
    color: r?.color || '',
    motorNumber: r?.motorNumber || '',
    chassisNumber: r?.chassisNumber || '',
    hullNumber: r?.hullNumber || '',
    price: r?.price ? String(Number(r.price)) : '',
    patentingAmount: r?.patentingAmount ? String(Number(r.patentingAmount)) : '',
    depositAmount: r?.depositAmount ? String(Number(r.depositAmount)) : '',
    paymentType: r?.paymentType || 'reserva',
    tradeInValue: r?.tradeInValue ? String(Number(r.tradeInValue)) : '',
    tradeInBrand: r?.tradeInBrand || '',
    tradeInModel: r?.tradeInModel || '',
    tradeInDomain: r?.tradeInDomain || '',
    tradeInPlate: r?.tradeInPlate || '',
    financingBalance: r?.financingBalance ? String(Number(r.financingBalance)) : '',
    financingType: r?.financingType || '',
    financingMethod: r?.financingMethod || '',
    financingInstallments: r?.financingInstallments ? String(r.financingInstallments) : '',
    notes: r?.notes || '',
  }
}

export function ReservationFormModal({ mode, editing, clients, onClose, onSubmit, isPending }: ReservationFormModalProps) {
  const [f, setF] = useState(toForm(editing))
  const [showSpouse, setShowSpouse] = useState(!!(editing?.spouseName))
  const [showTradeIn, setShowTradeIn] = useState(!!(editing?.tradeInBrand))

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
      clientEmail: c?.email || prev.clientEmail,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      date: f.date,
      clientId: f.clientId ? Number(f.clientId) : undefined,
      clientName: f.clientName,
      clientDni: f.clientDni || undefined,
      clientBirthDate: f.clientBirthDate || undefined,
      clientPhone: f.clientPhone || undefined,
      clientEmail: f.clientEmail || undefined,
      clientAddress: f.clientAddress || undefined,
      clientLocality: f.clientLocality || undefined,
      clientZip: f.clientZip || undefined,
      clientProvince: f.clientProvince || undefined,
      clientOccupation: f.clientOccupation || undefined,
      patentingName: f.patentingName || undefined,
      spouseName: f.spouseName || undefined,
      spouseDni: f.spouseDni || undefined,
      vehicleType: f.vehicleType,
      requestedUnit: f.requestedUnit || undefined,
      brand: f.brand,
      model: f.model || undefined,
      year: f.year ? Number(f.year) : undefined,
      color: f.color || undefined,
      motorNumber: f.motorNumber || undefined,
      chassisNumber: f.chassisNumber || undefined,
      hullNumber: f.hullNumber || undefined,
      price: f.price ? Number(f.price) : undefined,
      patentingAmount: f.patentingAmount ? Number(f.patentingAmount) : undefined,
      depositAmount: f.depositAmount ? Number(f.depositAmount) : undefined,
      paymentType: f.paymentType || undefined,
      tradeInValue: f.tradeInValue ? Number(f.tradeInValue) : undefined,
      tradeInBrand: f.tradeInBrand || undefined,
      tradeInModel: f.tradeInModel || undefined,
      tradeInDomain: f.tradeInDomain || undefined,
      tradeInPlate: f.tradeInPlate || undefined,
      financingBalance: f.financingBalance ? Number(f.financingBalance) : undefined,
      financingType: f.financingType || undefined,
      financingMethod: f.financingMethod || undefined,
      financingInstallments: f.financingInstallments ? Number(f.financingInstallments) : undefined,
      notes: f.notes || undefined,
    })
  }

  const precio = Number(f.price) || 0
  const patentamiento = Number(f.patentingAmount) || 0
  const sena = Number(f.depositAmount) || 0
  const total = precio + patentamiento
  const saldo = total - sena

  return (
    <Modal title={mode === 'edit' ? 'Editar reserva' : 'Nueva solicitud de reserva'} onClose={onClose} width={700}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <FormField label="Fecha de reserva">
          <input type="date" style={{ ...inputStyle, width: '100%' }} value={f.date} onChange={set('date')} />
        </FormField>

        {/* COMPRADOR */}
        <div style={sectionStyle}>DATOS DEL COMPRADOR</div>
        <FormField label="Cliente (vincular existente)">
          <SearchableSelect
            value={f.clientId}
            onChange={fillFromClient}
            options={clients.map((c: any) => ({ value: String(c.id), label: c.name }))}
            placeholder="Buscar cliente..."
            emptyLabel="Sin vincular / ingreso manual"
          />
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
          <FormField label="Fecha de Nacimiento">
            <input style={inputStyle} value={f.clientBirthDate} onChange={set('clientBirthDate')} placeholder="dd/mm/aaaa" />
          </FormField>
          <FormField label="Teléfonos">
            <input style={inputStyle} value={f.clientPhone} onChange={set('clientPhone')} />
          </FormField>
        </div>
        <FormField label="E-mail">
          <input type="email" style={inputStyle} value={f.clientEmail} onChange={set('clientEmail')} />
        </FormField>
        <div className="form-grid-2">
          <FormField label="Domicilio">
            <input style={inputStyle} value={f.clientAddress} onChange={set('clientAddress')} />
          </FormField>
          <FormField label="Localidad">
            <input style={inputStyle} value={f.clientLocality} onChange={set('clientLocality')} />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="C.P.">
            <input style={inputStyle} value={f.clientZip} onChange={set('clientZip')} />
          </FormField>
          <FormField label="Provincia">
            <input style={inputStyle} value={f.clientProvince} onChange={set('clientProvince')} />
          </FormField>
        </div>
        <FormField label="Ocupación">
          <input style={inputStyle} value={f.clientOccupation} onChange={set('clientOccupation')} />
        </FormField>

        {/* CÓNYUGE */}
        <button type="button" onClick={() => setShowSpouse(v => !v)}
          style={{ ...sectionStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', width: '100%', textAlign: 'left' }}>
          <span>DATOS DEL CÓNYUGE</span>
          <span style={{ fontSize: '14px' }}>{showSpouse ? '▲' : '▼ agregar'}</span>
        </button>
        {showSpouse && (
          <div className="form-grid-2">
            <FormField label="Apellido y Nombre">
              <input style={inputStyle} value={f.spouseName} onChange={set('spouseName')} />
            </FormField>
            <FormField label="DNI / CUIL">
              <input style={inputStyle} value={f.spouseDni} onChange={set('spouseDni')} />
            </FormField>
          </div>
        )}

        {/* PATENTAR / FACTURAR */}
        <div style={sectionStyle}>PATENTAMIENTO Y FACTURACIÓN</div>
        <FormField label="Sede derechos de Patentar y Facturar a nombre de">
          <input style={inputStyle} value={f.patentingName} onChange={set('patentingName')} />
        </FormField>

        {/* VEHÍCULO */}
        <div style={sectionStyle}>DATOS DEL VEHÍCULO</div>
        <div className="form-grid-2">
          <FormField label="Tipo *">
            <select style={inputStyle} value={f.vehicleType} onChange={set('vehicleType')}>
              <option value="moto">Motocicleta</option>
              <option value="lancha">Lancha / Embarcación</option>
            </select>
          </FormField>
          <FormField label="Unidad Solicitada">
            <input style={inputStyle} value={f.requestedUnit} onChange={set('requestedUnit')} />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Marca *">
            <input style={inputStyle} value={f.brand} onChange={set('brand')} required />
          </FormField>
          <FormField label="Modelo">
            <input style={inputStyle} value={f.model} onChange={set('model')} />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Año">
            <input style={inputStyle} type="number" min="1980" max="2030" value={f.year} onChange={set('year')} />
          </FormField>
          <FormField label="Color">
            <input style={inputStyle} value={f.color} onChange={set('color')} />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Nº Motor">
            <input style={inputStyle} value={f.motorNumber} onChange={set('motorNumber')} />
          </FormField>
          <FormField label="Nº Chasis">
            <input style={inputStyle} value={f.chassisNumber} onChange={set('chassisNumber')} />
          </FormField>
        </div>
        {f.vehicleType === 'lancha' && (
          <FormField label="Nº Casco">
            <input style={{ ...inputStyle, width: '100%' }} value={f.hullNumber} onChange={set('hullNumber')} />
          </FormField>
        )}

        {/* CONDICIONES ECONÓMICAS */}
        <div style={sectionStyle}>CONDICIONES ECONÓMICAS</div>
        <div className="form-grid-2">
          <FormField label="Precio de Lista ($)">
            <input style={inputStyle} type="number" min="0" value={f.price} onChange={set('price')} />
          </FormField>
          <FormField label="Patentamiento ($)">
            <input style={inputStyle} type="number" min="0" value={f.patentingAmount} onChange={set('patentingAmount')} />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Forma de Pago">
            <select style={inputStyle} value={f.paymentType} onChange={set('paymentType')}>
              <option value="reserva">Reserva</option>
              <option value="contado">Contado</option>
            </select>
          </FormField>
          <FormField label="Seña / Entrega ($)">
            <input style={inputStyle} type="number" min="0" value={f.depositAmount} onChange={set('depositAmount')} />
          </FormField>
        </div>

        {(precio > 0 || sena > 0) && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>PRECIO LISTA</div><div style={{ fontWeight: 700, color: '#0f172a' }}>${precio.toLocaleString('es-AR')}</div></div>
            <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>PATENTAMIENTO</div><div style={{ fontWeight: 700, color: '#0f172a' }}>${patentamiento.toLocaleString('es-AR')}</div></div>
            <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>SEÑA</div><div style={{ fontWeight: 700, color: '#16a34a' }}>${sena.toLocaleString('es-AR')}</div></div>
            <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>TOTAL / SALDO</div><div style={{ fontWeight: 700, color: '#dc2626' }}>${total.toLocaleString('es-AR')} / ${saldo > 0 ? saldo.toLocaleString('es-AR') : '—'}</div></div>
          </div>
        )}

        {/* VEHÍCULO USADO */}
        <button type="button" onClick={() => setShowTradeIn(v => !v)}
          style={{ ...sectionStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', width: '100%', textAlign: 'left' }}>
          <span>VEHÍCULO USADO (PERMUTA)</span>
          <span style={{ fontSize: '14px' }}>{showTradeIn ? '▲' : '▼ agregar'}</span>
        </button>
        {showTradeIn && (
          <>
            <div className="form-grid-2">
              <FormField label="Valor del Usado ($)">
                <input style={inputStyle} type="number" min="0" value={f.tradeInValue} onChange={set('tradeInValue')} />
              </FormField>
              <FormField label="Marca">
                <input style={inputStyle} value={f.tradeInBrand} onChange={set('tradeInBrand')} />
              </FormField>
            </div>
            <div className="form-grid-2">
              <FormField label="Modelo">
                <input style={inputStyle} value={f.tradeInModel} onChange={set('tradeInModel')} />
              </FormField>
              <FormField label="Dominio">
                <input style={inputStyle} value={f.tradeInDomain} onChange={set('tradeInDomain')} />
              </FormField>
            </div>
            <FormField label="Matrícula">
              <input style={{ ...inputStyle, width: '100%' }} value={f.tradeInPlate} onChange={set('tradeInPlate')} />
            </FormField>
          </>
        )}

        {/* FINANCIACIÓN */}
        <div style={sectionStyle}>FINANCIACIÓN</div>
        <div className="form-grid-2">
          <FormField label="Saldo a Financiar ($)">
            <input style={inputStyle} type="number" min="0" value={f.financingBalance} onChange={set('financingBalance')} />
          </FormField>
          <FormField label="Entidad">
            <select style={inputStyle} value={f.financingType} onChange={set('financingType')}>
              <option value="">Sin financiación</option>
              <option value="banco">Banco</option>
              <option value="financiera">Financiera</option>
              <option value="propia">Propia</option>
            </select>
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Modalidad">
            <select style={inputStyle} value={f.financingMethod} onChange={set('financingMethod')}>
              <option value="">—</option>
              <option value="cuotas">Cuotas</option>
              <option value="cheques">Cheques</option>
            </select>
          </FormField>
          <FormField label="Cantidad de cuotas">
            <input style={inputStyle} type="number" min="1" value={f.financingInstallments} onChange={set('financingInstallments')} />
          </FormField>
        </div>

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
