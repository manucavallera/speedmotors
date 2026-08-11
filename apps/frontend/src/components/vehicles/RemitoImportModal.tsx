import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { api, apiError } from '../../lib/api'
import {
  blankVehicleDraft,
  createVehicleTemplateWorkbook,
  parseVehicleWorkbook,
  toVehicleImportItems,
  validateVehicleDrafts,
  type VehicleBatchDefaults,
  type VehicleDraft,
  type VehicleImportItem,
} from '../../lib/vehicleBatch'

interface RemitoImportModalProps {
  onClose: () => void
  onImport: (items: VehicleImportItem[]) => void
  isPending: boolean
}

const defaultShared: VehicleBatchDefaults = { remitoNumber: '', ingresoTipo: '' }

export function RemitoImportModal({ onClose, onImport, isPending }: RemitoImportModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [shared, setShared] = useState(defaultShared)
  const [rows, setRows] = useState<VehicleDraft[]>([])
  const [error, setError] = useState('')
  const remitoInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  function updateRow(i: number, key: string, val: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }

  function addRow() {
    setRows(prev => [...prev, blankVehicleDraft()])
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
      const parsed = data as {
        remitoNumber?: string | null
        items?: Array<Partial<Omit<VehicleDraft, 'displacement'>> & { displacement?: number | null }>
      }
      setShared(prev => ({ ...prev, remitoNumber: parsed.remitoNumber ?? '' }))
      setRows((parsed.items ?? []).map(item => ({
        ...blankVehicleDraft(),
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
    } catch (error: unknown) {
      const message = apiError(error)
      setError(message === 'Error inesperado' ? 'Error al analizar el archivo' : message)
    } finally {
      setAnalyzing(false)
    }
  }

  function startManualEntry() {
    setRows([blankVehicleDraft()])
    setShared(defaultShared)
    setError('')
    setStep('review')
  }

  function downloadExcelTemplate() {
    XLSX.writeFile(createVehicleTemplateWorkbook(), 'plantilla-carga-motos.xlsx')
  }

  async function importExcel(file: File) {
    setError('')
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      setRows(parseVehicleWorkbook(workbook))
      setShared(defaultShared)
      setStep('review')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'No se pudo leer el Excel')
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = ''
    }
  }

  function handleImport() {
    const errors = validateVehicleDrafts(rows)
    if (errors.length > 0) {
      setError(errors.join('\n'))
      return
    }

    onImport(toVehicleImportItems(rows, shared))
  }

  const cellInput: React.CSSProperties = { ...inputStyle, fontSize: '12px', padding: '4px 6px', minWidth: 0 }
  const th: React.CSSProperties = { padding: '6px 8px', fontSize: '11px', fontWeight: 600, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }
  const td: React.CSSProperties = { padding: '4px 6px', verticalAlign: 'middle' }

  if (step === 'upload') return (
    <Modal title="Carga masiva de motos" onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          onClick={() => remitoInputRef.current?.click()}
          style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: file ? '#f0fdf4' : '#f8fafc' }}
        >
          <input ref={remitoInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} />
          {file
            ? <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>{file.name}</p>
            : <>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>📄</p>
                <p style={{ color: '#334155', fontSize: '14px', fontWeight: 600 }}>Subir remito</p>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>JPG, PNG, WebP o PDF — máx 10MB</p>
              </>
          }
        </div>

        <button
          onClick={analyze}
          disabled={!file || analyzing}
          style={{ ...btnPrimary, opacity: !file || analyzing ? 0.6 : 1 }}
        >
          {analyzing ? 'Analizando...' : 'Analizar remito'}
        </button>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={event => {
              const selected = event.target.files?.[0]
              if (selected) void importExcel(selected)
            }}
          />
          <p style={{ color: '#334155', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>📊 Cargar desde Excel</p>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>
            Descargá la plantilla, completá las motos y volvé a subirla.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={downloadExcelTemplate} style={btnSecondary}>Descargar plantilla Excel</button>
            <button type="button" onClick={() => excelInputRef.current?.click()} style={btnPrimary}>Seleccionar Excel</button>
          </div>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', whiteSpace: 'pre-line' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <button type="button" onClick={startManualEntry} style={btnSecondary}>Cargar manualmente</button>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        </div>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Revisar motos${shared.remitoNumber ? ` — remito ${shared.remitoNumber}` : ''}`} onClose={onClose} width={1180}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="N° remito">
            <input
              style={inputStyle}
              value={shared.remitoNumber}
              onChange={event => setShared(prev => ({ ...prev, remitoNumber: event.target.value }))}
              placeholder="0051-00024520"
            />
          </FormField>
          <FormField label="Ingreso">
            <select
              style={inputStyle}
              value={shared.ingresoTipo}
              onChange={event => setShared(prev => ({
                ...prev,
                ingresoTipo: event.target.value as VehicleBatchDefaults['ingresoTipo'],
              }))}
            >
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
                <th style={th}>Código proveedor</th>
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
                  <td style={td}><input style={cellInput} value={row.importCode} onChange={e => updateRow(i, 'importCode', e.target.value)} placeholder="Artículo proveedor" /></td>
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

        {error && <p style={{ color: '#dc2626', fontSize: '13px', whiteSpace: 'pre-line' }}>{error}</p>}

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
