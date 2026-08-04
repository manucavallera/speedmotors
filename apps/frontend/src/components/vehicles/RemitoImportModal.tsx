import { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { api } from '../../lib/api'

interface ParsedItem {
  internalCode: string
  importCode: string
  brand: string
  model: string
  displacement: string
  version: string
  color: string
  engineNumber: string
  chassisNumber: string
}

interface VehicleImportItem {
  type: 'moto'
  internalCode: string
  importCode: string | null
  brand: string
  model: string
  displacement: number | null
  version: string | null
  color: string | null
  chassisNumber: string | null
  engineNumber: string | null
  remitoNumber: string | null
  ingresoTipo?: string
  costPrice: string
  sellPrice: string
  status: 'disponible'
}

interface RemitoImportModalProps {
  onClose: () => void
  onImport: (items: VehicleImportItem[]) => void
  isPending: boolean
}

const defaultShared = { ingresoTipo: '' }

const blankRow = (): ParsedItem => ({
  internalCode: '', importCode: '', brand: '', model: '', displacement: '', version: '',
  color: '', engineNumber: '', chassisNumber: '',
})

export function RemitoImportModal({ onClose, onImport, isPending }: RemitoImportModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [remitoNumber, setRemitoNumber] = useState('')
  const [shared, setShared] = useState(defaultShared)
  const [rows, setRows] = useState<ParsedItem[]>([])
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sh = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setShared(prev => ({ ...prev, [key]: e.target.value }))

  function updateRow(i: number, key: string, val: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }

  function addRow() {
    setRows(prev => [...prev, blankRow()])
  }

  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }

  async function analyze() {
    if (!file) return
    setError('')
    setAnalyzing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/vehicles/parse-remito', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setRemitoNumber(data.remitoNumber ?? '')
      setRows((data.items ?? []).map((item: Partial<Omit<ParsedItem, 'internalCode' | 'displacement'>> & { displacement?: number | null }) => ({
        internalCode: '',
        importCode: item.importCode ?? '',
        brand: item.brand ?? '',
        model: item.model ?? '',
        displacement: item.displacement ? String(item.displacement) : '',
        version: item.version ?? '',
        color: item.color ?? '',
        engineNumber: item.engineNumber ?? '',
        chassisNumber: item.chassisNumber ?? '',
      })))
      setStep('review')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al analizar el archivo')
    } finally {
      setAnalyzing(false)
    }
  }

  function startManualEntry() {
    setRows([blankRow()])
    setRemitoNumber('')
    setError('')
    setStep('review')
  }

  function handleImport() {
    const incomplete = rows.some(r => !r.internalCode.trim() || !r.brand.trim() || !r.model.trim() || !r.chassisNumber.trim() || !r.engineNumber.trim())
    if (incomplete) {
      setError('Completá código interno, marca, modelo, chasis y motor de todas las motos')
      return
    }
    const codes = rows.map(r => r.internalCode.trim().toUpperCase())
    if (new Set(codes).size !== codes.length) {
      setError('Hay códigos internos repetidos en la carga')
      return
    }
    const items = rows.map(r => ({
      type: 'moto' as const,
      internalCode: r.internalCode.trim().toUpperCase(),
      brand: r.brand.trim(),
      model: r.model.trim(),
      displacement: r.displacement ? Number(r.displacement) : null,
      version: r.version.trim() || null,
      color: r.color.trim() || null,
      chassisNumber: r.chassisNumber.trim() || null,
      engineNumber: r.engineNumber.trim() || null,
      importCode: r.importCode || null,
      remitoNumber: remitoNumber || null,
      ingresoTipo: shared.ingresoTipo || undefined,
      costPrice: '0',
      sellPrice: '0',
      status: 'disponible' as const,
    }))
    onImport(items)
  }

  const cellInput: React.CSSProperties = { ...inputStyle, fontSize: '12px', padding: '4px 6px', minWidth: 0 }
  const th: React.CSSProperties = { padding: '6px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }
  const td: React.CSSProperties = { padding: '4px 6px', verticalAlign: 'middle' }

  if (step === 'upload') return (
    <Modal title="Importar remito" onClose={onClose} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: file ? '#f0fdf4' : '#f8fafc' }}
        >
          <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} />
          {file
            ? <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>{file.name}</p>
            : <>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>📄</p>
                <p style={{ color: '#475569', fontSize: '14px' }}>Hacé click para subir el remito</p>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>JPG, PNG, WebP o PDF — máx 10MB</p>
              </>
          }
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          <button type="button" onClick={startManualEntry} style={btnSecondary}>Cargar manualmente</button>
          <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button
            onClick={analyze}
            disabled={!file || analyzing}
            style={{ ...btnPrimary, opacity: !file || analyzing ? 0.6 : 1 }}
          >
            {analyzing ? 'Analizando...' : 'Analizar remito'}
          </button>
          </div>
        </div>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Revisar motos${remitoNumber ? ` — remito ${remitoNumber}` : ''}`} onClose={onClose} width={1180}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="N° remito">
            <input style={inputStyle} value={remitoNumber} onChange={e => setRemitoNumber(e.target.value)} placeholder="0051-00024520" />
          </FormField>
          <FormField label="Ingreso">
            <select style={inputStyle} value={shared.ingresoTipo} onChange={sh('ingresoTipo')}>
              <option value="">Sin especificar</option>
              <option value="blanco">En blanco</option>
              <option value="negro">En negro</option>
              <option value="mixto">Mixto</option>
            </select>
          </FormField>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={th}>Código interno</th>
                <th style={th}>Marca</th>
                <th style={th}>Modelo</th>
                <th style={th}>Cilindrada</th>
                <th style={th}>Versión</th>
                <th style={th}>Color</th>
                <th style={th}>Chasis</th>
                <th style={th}>Motor</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}><input style={cellInput} value={row.internalCode} onChange={e => updateRow(i, 'internalCode', e.target.value)} placeholder="Código propio" /></td>
                  <td style={td}><input style={cellInput} value={row.brand} onChange={e => updateRow(i, 'brand', e.target.value)} /></td>
                  <td style={td}><input style={cellInput} value={row.model} onChange={e => updateRow(i, 'model', e.target.value)} /></td>
                  <td style={td}><input style={{ ...cellInput, width: '82px' }} type="number" min="0" value={row.displacement} onChange={e => updateRow(i, 'displacement', e.target.value)} /></td>
                  <td style={td}><input style={cellInput} value={row.version} onChange={e => updateRow(i, 'version', e.target.value)} placeholder="R2 V01" /></td>
                  <td style={td}><input style={cellInput} value={row.color} onChange={e => updateRow(i, 'color', e.target.value)} placeholder="Rojo" /></td>
                  <td style={td}><input style={cellInput} value={row.chassisNumber} onChange={e => updateRow(i, 'chassisNumber', e.target.value)} /></td>
                  <td style={td}><input style={cellInput} value={row.engineNumber} onChange={e => updateRow(i, 'engineNumber', e.target.value)} /></td>
                  <td style={td}>
                    <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}

        <button onClick={addRow} style={{ ...btnSecondary, alignSelf: 'flex-start', fontSize: '13px' }}>+ Agregar fila</button>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setStep('upload')} style={btnSecondary}>← Volver</button>
          <button
            onClick={handleImport}
            disabled={isPending || rows.length === 0}
            style={{ ...btnPrimary, opacity: isPending || rows.length === 0 ? 0.6 : 1 }}
          >
            {isPending ? 'Importando...' : `Importar ${rows.length} vehículo${rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
