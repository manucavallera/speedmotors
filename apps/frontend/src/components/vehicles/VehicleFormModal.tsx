import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { QRScannerField } from '../ui/QRScannerField'
import { PhotoUploadField } from '../products/PhotoUploadField'

const emptyForm = {
  type: 'moto', brand: '', model: '', year: '', color: '',
  chassisNumber: '', engineNumber: '', importCode: '', ingresoTipo: '',
  costPrice: '', sellPrice: '', status: 'disponible', notes: '', photoUrl: '',
}

export interface VehicleFormData {
  type: string; brand: string; model: string; year: number | null; color: string
  chassisNumber: string; engineNumber: string; importCode: string; ingresoTipo: string
  costPrice: string; sellPrice: string; status: string; notes: string; photos: string[]
}

interface VehicleFormModalProps {
  mode: 'create' | 'edit'
  editing: any | null
  onClose: () => void
  onSubmit: (data: VehicleFormData) => void
  isPending: boolean
}

function toForm(v: any) {
  return {
    type: v.type, brand: v.brand, model: v.model, year: String(v.year || ''),
    color: v.color || '', chassisNumber: v.chassisNumber || '',
    engineNumber: v.engineNumber || '', importCode: v.importCode || '',
    ingresoTipo: v.ingresoTipo || '', costPrice: v.costPrice, sellPrice: v.sellPrice,
    status: v.status, notes: v.notes || '',
    photoUrl: v.photos?.[0] || '',
  }
}

export function VehicleFormModal({ mode, editing, onClose, onSubmit, isPending }: VehicleFormModalProps) {
  const [form, setForm] = useState<any>(editing ? toForm(editing) : emptyForm)

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev: any) => ({ ...prev, [key]: e.target.value }))
  const set = (key: string) => (val: string) =>
    setForm((prev: any) => ({ ...prev, [key]: val }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      year: form.year ? Number(form.year) : null,
      photos: form.photoUrl ? [form.photoUrl] : [],
    })
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar vehículo' : 'Nuevo vehículo'} onClose={onClose} width={580}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div className="form-grid-2">
          <FormField label="Tipo">
            <select style={inputStyle} value={form.type} onChange={f('type')}>
              <option value="moto">Moto</option>
              <option value="lancha">Lancha</option>
            </select>
          </FormField>
          <FormField label="Estado">
            <select style={inputStyle} value={form.status} onChange={f('status')}>
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </FormField>
        </div>

        <div className="form-grid-2">
          <FormField label="Marca"><input style={inputStyle} value={form.brand} onChange={f('brand')} required /></FormField>
          <FormField label="Modelo"><input style={inputStyle} value={form.model} onChange={f('model')} required /></FormField>
        </div>

        <div className="form-grid-2">
          <FormField label="Año"><input style={inputStyle} type="number" value={form.year} onChange={f('year')} /></FormField>
          <FormField label="Color"><input style={inputStyle} value={form.color} onChange={f('color')} /></FormField>
        </div>

        <FormField label="N° de chasis">
          <QRScannerField value={form.chassisNumber} onChange={set('chassisNumber')} label="N° de chasis" placeholder="Escanear o ingresar manualmente" />
        </FormField>

        <FormField label="N° de motor">
          <QRScannerField value={form.engineNumber} onChange={set('engineNumber')} label="N° de motor" placeholder="Escanear o ingresar manualmente" />
        </FormField>

        <div className="form-grid-2">
          <FormField label="Código de importación">
            <input style={inputStyle} value={form.importCode} onChange={f('importCode')} placeholder="Ej: IMP-2024-00123" />
          </FormField>
          <FormField label="Ingreso">
            <select style={inputStyle} value={form.ingresoTipo} onChange={f('ingresoTipo')}>
              <option value="">Sin especificar</option>
              <option value="blanco">🧾 En blanco (con factura)</option>
              <option value="negro">🤝 En negro (sin factura)</option>
            </select>
          </FormField>
        </div>

        <div className="form-grid-2">
          <FormField label="Precio costo ($)"><input style={inputStyle} type="number" value={form.costPrice} onChange={f('costPrice')} required /></FormField>
          <FormField label="Precio venta ($)"><input style={inputStyle} type="number" value={form.sellPrice} onChange={f('sellPrice')} required /></FormField>
        </div>

        <FormField label="Foto del vehículo">
          <PhotoUploadField photoUrl={form.photoUrl} onChange={set('photoUrl')} />
        </FormField>

        <FormField label="Notas">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} value={form.notes} onChange={f('notes')} />
        </FormField>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
