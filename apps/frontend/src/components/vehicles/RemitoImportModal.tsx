import { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { api } from '../../lib/api'

interface ParsedItem {
  importCode: string
  model: string
  engineNumber: string
  chassisNumber: string
  brand: string
  color: string
  costPrice: string
  sellPrice: string
}

interface RemitoImportModalProps {
  onClose: () => void
  onImport: (items: any[]) => void
  isPending: boolean
}

const defaultShared = { type: 'moto', year: '', ingresoTipo: 'blanco', brand: '', supplier: '' }

export function RemitoImportModal({ onClose, onImport, isPending }: RemitoImportModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [remitoNumber, setRemitoNumber] = useState('')
  const [shared, setShared] = useState(defaultShared)
  const [rows, setRows] = useState<ParsedItem[]>([])
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sh = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setShared(prev => ({ ...prev, [key]: e.target.value }))

  function updateRow(i: number, key: string, val: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }

  function addRow() {
    setRows(prev => [...prev, { importCode: '', model: '', engineNumber: '', chassisNumber: '', brand: '', color: '', costPrice: '', sellPrice: '' }])
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
      setRows((data.items ?? []).map((item: any) => ({
        importCode: item.importCode ?? '',
        model: item.model ?? '',
        engineNumber: item.engineNumber ?? '',
        chassisNumber: item.chassisNumber ?? '',
        brand: item.brand || shared.brand,
        color: '',
        costPrice: '',
        sellPrice: '',
      })))
      setStep('review')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al analizar el archivo')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleImport() {
    const items = rows.map(r => ({
      type: shared.type,
      brand: shared.brand || r.brand || 'Sin marca',
      model: r.model,
      year: shared.year ? Number(shared.year) : null,
      color: r.color || null,
      chassisNumber: r.chassisNumber || null,
      engineNumber: r.engineNumber || null,
      importCode: r.importCode || null,
      remitoNumber: remitoNumber || null,
      ingresoTipo: shared.ingresoTipo,
      costPrice: r.costPrice || '0',
      sellPrice: r.sellPrice || '0',
      status: 'disponible',
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

        <FormField label="Proveedor (opcional)">
          <input style={inputStyle} value={shared.supplier} onChange={sh('supplier')} placeholder="Ej: Motomel SA" />
        </FormField>

        {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
    </Modal>
  )

  return (
    <Modal title={`Revisar remito${remitoNumber ? ` — ${remitoNumber}` : ''}`} onClose={onClose} width={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <FormField label="N° remito">
            <input style={inputStyle} value={remitoNumber} onChange={e => setRemitoNumber(e.target.value)} placeholder="0051-00024520" />
          </FormField>
          <FormField label="Marca (lote)">
            <input style={inputStyle} value={shared.brand} onChange={sh('brand')} placeholder="Ej: Motomel" />
          </FormField>
          <FormField label="Año">
            <input style={inputStyle} type="number" value={shared.year} onChange={sh('year')} placeholder="2024" />
          </FormField>
          <FormField label="Tipo">
            <select style={inputStyle} value={shared.type} onChange={sh('type')}>
              <option value="moto">Moto</option>
              <option value="lancha">Lancha</option>
            </select>
          </FormField>
          <FormField label="Ingreso">
            <select style={inputStyle} value={shared.ingresoTipo} onChange={sh('ingresoTipo')}>
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
                <th style={th}>Artículo</th>
                <th style={th}>Modelo</th>
                <th style={th}>Motor</th>
                <th style={th}>Chasis</th>
                <th style={th}>Color</th>
                <th style={th}>$ Costo</th>
                <th style={th}>$ Venta</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}><input style={cellInput} value={row.importCode} onChange={e => updateRow(i, 'importCode', e.target.value)} /></td>
                  <td style={td}><input style={cellInput} value={row.model} onChange={e => updateRow(i, 'model', e.target.value)} /></td>
                  <td style={td}><input style={cellInput} value={row.engineNumber} onChange={e => updateRow(i, 'engineNumber', e.target.value)} /></td>
                  <td style={td}><input style={cellInput} value={row.chassisNumber} onChange={e => updateRow(i, 'chassisNumber', e.target.value)} /></td>
                  <td style={td}><input style={cellInput} value={row.color} onChange={e => updateRow(i, 'color', e.target.value)} placeholder="Rojo" /></td>
                  <td style={td}><input style={cellInput} type="number" value={row.costPrice} onChange={e => updateRow(i, 'costPrice', e.target.value)} placeholder="0" /></td>
                  <td style={td}><input style={cellInput} type="number" value={row.sellPrice} onChange={e => updateRow(i, 'sellPrice', e.target.value)} placeholder="0" /></td>
                  <td style={td}>
                    <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
