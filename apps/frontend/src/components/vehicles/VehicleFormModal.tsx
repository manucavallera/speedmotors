import { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { QRScannerField } from '../ui/QRScannerField'
import { PhotoCarouselField } from '../ui/PhotoCarouselField'
import { api } from '../../lib/api'

const emptyForm = {
  type: 'moto', brand: '', model: '', displacement: '', version: '', year: '', color: '',
  chassisNumber: '', engineNumber: '', internalCode: '', importCode: '', ingresoTipo: '',
  costPrice: '', sellPrice: '', status: 'disponible', notes: '', photos: [] as string[],
}

export interface VehicleFormData {
  type: string; brand: string; model: string; displacement: number | null; version: string; year: number | null; color: string
  chassisNumber: string; engineNumber: string; internalCode: string; importCode: string; ingresoTipo: string
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
    type: v.type, brand: v.brand, model: v.model, displacement: String(v.displacement || ''),
    version: v.version || '', year: String(v.year || ''),
    color: v.color || '', chassisNumber: v.chassisNumber || '',
    engineNumber: v.engineNumber || '', internalCode: v.internalCode || '', importCode: v.importCode || '',
    ingresoTipo: v.ingresoTipo || '', costPrice: v.costPrice, sellPrice: v.sellPrice,
    status: v.status, notes: v.notes || '',
    photos: v.photos || [],
  }
}

export function VehicleFormModal({ mode, editing, onClose, onSubmit, isPending }: VehicleFormModalProps) {
  const [form, setForm] = useState<any>(editing ? toForm(editing) : emptyForm)
  const [scanning, setScanning] = useState(false)
  const tituloInputRef = useRef<HTMLInputElement>(null)

  async function handleTituloScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/vehicles/parse-titulo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm((prev: any) => ({
        ...prev,
        brand: data.brand || prev.brand,
        model: data.model || prev.model,
        year: data.year || prev.year,
        chassisNumber: data.chassisNumber || prev.chassisNumber,
        engineNumber: data.engineNumber || prev.engineNumber,
      }))
    } catch {
      // silencioso
    } finally {
      setScanning(false)
      if (tituloInputRef.current) tituloInputRef.current.value = ''
    }
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev: any) => ({ ...prev, [key]: e.target.value }))
  const set = (key: string) => (val: string) =>
    setForm((prev: any) => ({ ...prev, [key]: val }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      displacement: form.displacement ? Number(form.displacement) : null,
      year: form.year ? Number(form.year) : null,
      ingresoTipo: form.ingresoTipo || undefined,
      costPrice: form.costPrice || '0',
      sellPrice: form.sellPrice || '0',
    })
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar vehículo' : 'Nuevo vehículo'} onClose={onClose} width={580}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '20px' }}>📄</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Escanear título</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Completá marca, modelo, chasis y motor automáticamente</p>
          </div>
          <input ref={tituloInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleTituloScan} />
          <button type="button" onClick={() => tituloInputRef.current?.click()} disabled={scanning}
            style={{ ...btnSecondary, fontSize: '12px', padding: '6px 12px', opacity: scanning ? 0.6 : 1 }}>
            {scanning ? 'Leyendo...' : 'Subir foto'}
          </button>
        </div>

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
          <FormField label="Cilindrada (cc)"><input style={inputStyle} type="number" min="0" value={form.displacement} onChange={f('displacement')} /></FormField>
          <FormField label="Versión"><input style={inputStyle} value={form.version} onChange={f('version')} placeholder="Ej: R2 V01" /></FormField>
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
          <FormField label="Código interno">
            <input style={inputStyle} value={form.internalCode} onChange={f('internalCode')} placeholder="Código asignado por ustedes" />
          </FormField>
          <FormField label="Artículo del proveedor">
            <input style={inputStyle} value={form.importCode} onChange={f('importCode')} placeholder="Código que figura en el remito" />
          </FormField>
        </div>

        <div className="form-grid-2">
          <FormField label="Ingreso">
            <select style={inputStyle} value={form.ingresoTipo} onChange={f('ingresoTipo')}>
              <option value="">Sin especificar</option>
              <option value="blanco">🧾 En blanco (con factura)</option>
              <option value="negro">🤝 En negro (sin factura)</option>
            </select>
          </FormField>
          <div />
        </div>

        <div className="form-grid-2">
          <FormField label="Precio costo ($) — opcional"><input style={inputStyle} type="number" value={form.costPrice} onChange={f('costPrice')} placeholder="Se puede completar después" /></FormField>
          <FormField label="Precio venta ($) — opcional"><input style={inputStyle} type="number" value={form.sellPrice} onChange={f('sellPrice')} placeholder="Se puede completar después" /></FormField>
        </div>

        <FormField label="Fotos del vehículo">
          <PhotoCarouselField photos={form.photos} onChange={photos => setForm((p: any) => ({ ...p, photos }))} />
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
