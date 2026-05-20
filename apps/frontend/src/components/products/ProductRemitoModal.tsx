import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { api } from '../../lib/api'
import { toast } from '../../lib/toast'

interface ParsedItem {
  name: string
  code: string | null
  quantity: number
  unitPrice: number | null
}

interface ProductRemitoModalProps {
  onClose: () => void
}

export function ProductRemitoModal({ onClose }: ProductRemitoModalProps) {
  const qc = useQueryClient()
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [remitoNumber, setRemitoNumber] = useState('')
  const [rows, setRows] = useState<ParsedItem[]>([])
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const receive = useMutation({
    mutationFn: (items: ParsedItem[]) =>
      api.post('/products/receive-remito', { items, remitoNumber: remitoNumber || null }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Remito registrado — stock actualizado')
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al registrar remito'),
  })

  async function analyze() {
    if (!file) return
    setError('')
    setAnalyzing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/products/parse-remito', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setRemitoNumber(data.remitoNumber ?? '')
      setRows(data.items ?? [])
      setStep('review')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al analizar el archivo')
    } finally {
      setAnalyzing(false)
    }
  }

  function updateQuantity(i: number, val: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, quantity: val } : r))
  }

  const th: React.CSSProperties = { padding: '7px 10px', fontSize: '11px', fontWeight: 600, color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '6px 10px', verticalAlign: 'middle' }

  if (step === 'upload') return (
    <Modal title="Recibir remito de productos" onClose={onClose} width={480}>
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
                <p style={{ color: '#475569', fontSize: '14px' }}>Subí el remito del proveedor</p>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>JPG, PNG, WebP o PDF — máx 10MB</p>
              </>
          }
        </div>
        {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={analyze} disabled={!file || analyzing} style={{ ...btnPrimary, opacity: !file || analyzing ? 0.6 : 1 }}>
            {analyzing ? 'Analizando...' : 'Analizar con IA'}
          </button>
        </div>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Revisar remito${remitoNumber ? ` — ${remitoNumber}` : ''}`} onClose={onClose} width={700}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="N° remito">
          <input style={{ ...inputStyle, maxWidth: '220px' }} value={remitoNumber} onChange={e => setRemitoNumber(e.target.value)} placeholder="0001-00001234" />
        </FormField>

        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          IA detectó <strong>{rows.length}</strong> items. Revisá las cantidades y confirmá — los productos se crean si no existen.
        </p>

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={th}>Producto</th>
                <th style={th}>Código</th>
                <th style={{ ...th, width: '90px' }}>Cantidad</th>
                <th style={{ ...th, width: '100px' }}>Precio costo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}>
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.name}</span>
                  </td>
                  <td style={td}>
                    <span style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>{row.code ?? '—'}</span>
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={e => updateQuantity(i, Number(e.target.value))}
                      style={{ ...inputStyle, fontSize: '13px', padding: '5px 8px', width: '70px' }}
                    />
                  </td>
                  <td style={td}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      {row.unitPrice != null ? `$${row.unitPrice.toLocaleString('es-AR')}` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setStep('upload')} style={btnSecondary}>← Volver</button>
          <button
            onClick={() => receive.mutate(rows)}
            disabled={receive.isPending || rows.length === 0}
            style={{ ...btnPrimary, opacity: receive.isPending || rows.length === 0 ? 0.6 : 1 }}
          >
            {receive.isPending ? 'Registrando...' : `Confirmar ${rows.length} item${rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
