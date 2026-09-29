import { useState } from 'react'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../components/ui/FormField'
import { generatePreprintedCalibration } from '../lib/pdf'
import { loadPrintOffset, savePrintOffset } from '../lib/pdf/preprinted/settings'
import type { PrintedFormKind, PrintOffset } from '../lib/pdf/preprinted/types'

const STORAGE_KEY = 'speedmotors_settings'

const defaults = {
  businessName: 'Speed Motors',
  tagline: 'Motos · Lanchas · Accesorios · Repuestos',
  address: '',
  phone: '',
  email: '',
  cuit: '',
  condicionIva: 'Responsable Inscripto',
}

export function loadSettings(): typeof defaults {
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<typeof defaults>) }
  } catch {
    return defaults
  }
}

export function SettingsPage() {
  const [form, setForm] = useState(loadSettings())
  const [saved, setSaved] = useState(false)
  const [invoiceOffset, setInvoiceOffset] = useState(loadPrintOffset('invoice'))
  const [remitoOffset, setRemitoOffset] = useState(loadPrintOffset('remito'))
  const [printSaved, setPrintSaved] = useState(false)

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setForm(defaults)
    localStorage.removeItem(STORAGE_KEY)
  }

  function savePrintSettings() {
    savePrintOffset('invoice', invoiceOffset)
    savePrintOffset('remito', remitoOffset)
    setPrintSaved(true)
    setTimeout(() => setPrintSaved(false), 2000)
  }

  const offsetFields = (kind: PrintedFormKind, value: PrintOffset, setValue: (offset: PrintOffset) => void) => {
    const label = kind === 'invoice' ? 'Factura A4' : 'Remito Carta'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
        <FormField label={`${label} X (mm)`}><input aria-label={`${label} X (mm)`} style={inputStyle} type="number" step="0.1" value={value.x} onChange={e => setValue({ ...value, x: Number(e.target.value) })} /></FormField>
        <FormField label={`${label} Y (mm)`}><input aria-label={`${label} Y (mm)`} style={inputStyle} type="number" step="0.1" value={value.y} onChange={e => setValue({ ...value, y: Number(e.target.value) })} /></FormField>
        <button type="button" onClick={() => generatePreprintedCalibration(kind, value)} style={{ ...btnSecondary, marginBottom: '1px', whiteSpace: 'nowrap' }}>Prueba {kind === 'invoice' ? 'factura' : 'remito'}</button>
      </div>
    )
  }


  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Configuración</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Datos del negocio — aparecen en todos los comprobantes PDF</p>
      </div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', maxWidth: '560px', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 6px' }}>Impresión en formularios preimpresos</h2>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>Imprimí la prueba sobre una fotocopia. Usá 100% de escala, tamaño A4 para factura o Carta para remito y desactivá encabezados y pies del navegador.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {offsetFields('invoice', invoiceOffset, setInvoiceOffset)}
          {offsetFields('remito', remitoOffset, setRemitoOffset)}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={savePrintSettings} style={btnPrimary}>{printSaved ? '✓ Guardado' : 'Guardar calibración'}</button></div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', maxWidth: '560px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Nombre del negocio">
            <input style={inputStyle} value={form.businessName} onChange={f('businessName')} />
          </FormField>
          <FormField label="Slogan / Descripción">
            <input style={inputStyle} value={form.tagline} onChange={f('tagline')} placeholder="Ej: Motos · Lanchas · Accesorios" />
          </FormField>
          <div className="form-grid-2">
            <FormField label="Teléfono">
              <input style={inputStyle} value={form.phone} onChange={f('phone')} placeholder="Ej: +54 9 11 1234-5678" />
            </FormField>
            <FormField label="Email">
              <input style={inputStyle} type="email" value={form.email} onChange={f('email')} />
            </FormField>
          </div>
          <FormField label="Dirección">
            <input style={inputStyle} value={form.address} onChange={f('address')} placeholder="Ej: Av. Rivadavia 1234, Buenos Aires" />
          </FormField>
          <div className="form-grid-2">
            <FormField label="CUIT">
              <input style={inputStyle} value={form.cuit} onChange={f('cuit')} placeholder="Ej: 20-12345678-9" />
            </FormField>
            <FormField label="Condición IVA">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={(form as any).condicionIva} onChange={e => setForm(p => ({ ...p, condicionIva: e.target.value }))}>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributista">Monotributista</option>
                <option value="Exento">Exento</option>
              </select>
            </FormField>
          </div>

          {/* Preview del encabezado */}
          <div style={{ background: '#0f172a', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ color: 'white', fontSize: '15px', fontWeight: 700 }}>{form.businessName || 'Nombre del negocio'}</div>
            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>{form.tagline}</div>
            {(form.phone || form.address) && (
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px' }}>
                {[form.phone, form.address].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleReset} style={btnSecondary}>Restaurar defaults</button>
            <button type="submit" style={btnPrimary}>
              {saved ? '✓ Guardado' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
