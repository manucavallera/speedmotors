import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Modal } from './ui/Modal'
import { btnPrimary, btnSecondary, inputStyle } from './ui/FormField'

interface ParsedRow { code: string; name: string; brand?: string; costPrice: number; sellPrice?: number }

interface Props { onClose: () => void; onImport: (products: ParsedRow[]) => Promise<any> }

interface ColSelectProps { field: string; label: string; headers: string[]; mapping: Record<string, string>; onChange: (field: string, value: string) => void }
function ColSelect({ field, label, headers, mapping, onChange }: ColSelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{label}</label>
      <select style={inputStyle} value={mapping[field]} onChange={e => onChange(field, e.target.value)}>
        <option value="">— no usar —</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  )
}

// Detecta automáticamente en qué fila están los encabezados reales
function detectHeaderRow(data: any[][]): number {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i]
    const textCells = row.filter((c: any) => {
      const s = String(c).trim()
      return s.length > 0 && s.length < 60 && !/^\d/.test(s) && !s.includes('$') && !s.includes('Cotizacion') && !s.includes('vigencia')
    })
    if (textCells.length >= 3) return i + 1
  }
  return 1
}

function autoDetect(hdrs: string[]): Record<string, string> {
  const auto: Record<string, string> = { code: '', name: '', brand: '', costPrice: '', sellPrice: '' }
  hdrs.forEach(h => {
    const l = h.toLowerCase()
    if (!auto.code && (l.includes('cod') || l.includes('código') || l.includes('art'))) auto.code = h
    if (!auto.name && (l.includes('desc') || l.includes('nombre') || l.includes('product'))) auto.name = h
    if (!auto.brand && (l.includes('marc') || l.includes('brand'))) auto.brand = h
    if (!auto.costPrice && (l.includes('costo') || l.includes('precio') || l.includes('cost') || l.includes('neto') || l.includes('ars'))) auto.costPrice = h
    if (!auto.sellPrice && (l.includes('venta') || l.includes('pvp') || l.includes('sell') || l.includes('iva'))) auto.sellPrice = h
  })
  return auto
}

export function ImportExcelModal({ onClose, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload')
  const [wb, setWb] = useState<XLSX.WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [headerRow, setHeaderRow] = useState(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({ code: '', name: '', brand: '', costPrice: '', sellPrice: '' })
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [markup, setMarkup] = useState('30')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const workbook = XLSX.read(ev.target?.result, { type: 'binary' })
      setWb(workbook)
      setSheetNames(workbook.SheetNames)
      setSelectedSheet(workbook.SheetNames[0])
      const data: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' })
      const detectedRow = detectHeaderRow(data)
      setHeaderRow(detectedRow)
      parseSheet(workbook, workbook.SheetNames[0], detectedRow)
    }
    reader.readAsBinaryString(file)
  }

  function parseSheet(workbook: XLSX.WorkBook, sheetName: string, hRow: number) {
    const ws = workbook.Sheets[sheetName]
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    if (data.length < hRow) return
    const hdrs = data[hRow - 1].map((h: any) => String(h).trim()).filter((h: string) => h !== '')
    setHeaders(hdrs)
    setRawRows(data.slice(hRow).filter(r => r.some((c: any) => c !== '')))
    setMapping(autoDetect(hdrs))
    setStep('map')
  }

  function handleSheetChange(name: string) {
    setSelectedSheet(name)
    if (wb) {
      const data: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
      const detectedRow = detectHeaderRow(data)
      setHeaderRow(detectedRow)
      parseSheet(wb, name, detectedRow)
    }
  }

  function handleHeaderRowChange(val: number) {
    setHeaderRow(val)
    if (wb) parseSheet(wb, selectedSheet, val)
  }

  function buildPreview() {
    if (!mapping.code || !mapping.name || !mapping.costPrice) return
    const markupFactor = 1 + (parseFloat(markup) || 30) / 100
    const rows: ParsedRow[] = rawRows.slice(0, 200).map(row => {
      const get = (col: string) => col ? String(row[headers.indexOf(col)] ?? '').trim() : ''
      const costPrice = parseFloat(get(mapping.costPrice).replace(',', '.')) || 0
      return {
        code: get(mapping.code),
        name: get(mapping.name),
        brand: mapping.brand ? get(mapping.brand) || undefined : undefined,
        costPrice,
        sellPrice: mapping.sellPrice ? parseFloat(get(mapping.sellPrice).replace(',', '.')) || costPrice * markupFactor : costPrice * markupFactor,
      }
    }).filter(r => r.code && r.name && r.costPrice > 0)
    setPreview(rows)
    setStep('preview')
  }

  async function handleImport() {
    const markupFactor = 1 + (parseFloat(markup) || 30) / 100
    if (rawRows.length > 10000) { alert('Máximo 10.000 productos por importación'); return }
    const allRows: ParsedRow[] = rawRows.map(row => {
      const get = (col: string) => col ? String(row[headers.indexOf(col)] ?? '').trim() : ''
      const costPrice = parseFloat(get(mapping.costPrice).replace(',', '.')) || 0
      return {
        code: get(mapping.code),
        name: get(mapping.name),
        brand: mapping.brand ? get(mapping.brand) || undefined : undefined,
        costPrice,
        sellPrice: mapping.sellPrice ? parseFloat(get(mapping.sellPrice).replace(',', '.')) || costPrice * markupFactor : costPrice * markupFactor,
      }
    }).filter(r => r.code && r.name && r.costPrice > 0)
    setLoading(true)
    try {
      const res = await onImport(allRows)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  const handleColChange = (field: string, value: string) => setMapping(m => ({ ...m, [field]: value }))

  return (
    <Modal title="Importar lista de precios (Excel)" onClose={onClose} width={600}>
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
          <div style={{ fontSize: '48px' }}>📊</div>
          <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '360px' }}>
            Subí el Excel del proveedor. El sistema detecta las columnas automáticamente y te permite mapearlas antes de importar.
          </p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={btnPrimary}>Seleccionar archivo</button>
        </div>
      )}

      {step === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selector de hoja y fila de encabezados */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Hoja del Excel</label>
              <select style={inputStyle} value={selectedSheet} onChange={e => handleSheetChange(e.target.value)}>
                {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Fila de encabezados</label>
              <input style={inputStyle} type="number" min={1} max={10} value={headerRow}
                onChange={e => handleHeaderRowChange(parseInt(e.target.value) || 1)} />
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: '13px' }}>
            {rawRows.length} filas detectadas. Verificá que las columnas coincidan:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <ColSelect field="code" label="Código *" headers={headers} mapping={mapping} onChange={handleColChange} />
            <ColSelect field="name" label="Descripción / Nombre *" headers={headers} mapping={mapping} onChange={handleColChange} />
            <ColSelect field="costPrice" label="Precio costo *" headers={headers} mapping={mapping} onChange={handleColChange} />
            <ColSelect field="sellPrice" label="Precio venta (opcional)" headers={headers} mapping={mapping} onChange={handleColChange} />
            <ColSelect field="brand" label="Marca (opcional)" headers={headers} mapping={mapping} onChange={handleColChange} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Markup si no hay precio venta (%)</label>
              <input style={inputStyle} type="number" value={markup} onChange={e => setMarkup(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('upload')} style={btnSecondary}>Volver</button>
            <button onClick={buildPreview} style={btnPrimary}
              disabled={!mapping.code || !mapping.name || !mapping.costPrice}>
              Ver preview →
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && !result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Preview de los primeros {preview.length} productos (de {rawRows.length} total). Los existentes se actualizan por código.
          </p>
          <div style={{ maxHeight: '260px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                <tr>{['Código', 'Descripción', 'Marca', 'Costo', 'Venta'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '7px 12px', fontFamily: 'monospace', color: '#64748b' }}>{r.code}</td>
                    <td style={{ padding: '7px 12px', color: '#0f172a' }}>{r.name}</td>
                    <td style={{ padding: '7px 12px', color: '#64748b' }}>{r.brand || '—'}</td>
                    <td style={{ padding: '7px 12px', color: '#374151' }}>${r.costPrice.toLocaleString('es-AR')}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 600, color: '#16a34a' }}>${(r.sellPrice || 0).toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('map')} style={btnSecondary}>Volver</button>
            <button onClick={handleImport} style={btnPrimary} disabled={loading}>
              {loading ? 'Importando...' : `Importar ${rawRows.length} productos`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
          <div style={{ fontSize: '48px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Importación completada</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%' }}>
            {[
              { label: 'Creados', value: result.created, color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Actualizados', value: result.updated, color: '#2563eb', bg: '#eff6ff' },
              { label: 'Errores', value: result.errors, color: result.errors > 0 ? '#dc2626' : '#94a3b8', bg: result.errors > 0 ? '#fef2f2' : '#f8fafc' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={btnPrimary}>Cerrar</button>
        </div>
      )}
    </Modal>
  )
}
