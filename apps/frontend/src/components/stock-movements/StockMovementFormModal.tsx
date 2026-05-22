import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { QRScannerField } from '../ui/QRScannerField'

export interface StockMovementFormData {
  productId: number
  type: string
  quantity: number
  reason: string
}

interface StockMovementFormModalProps {
  products: any[]
  onClose: () => void
  onSubmit: (data: StockMovementFormData) => void
  isPending: boolean
  onCreateProduct?: (barcode: string) => void
}

export function StockMovementFormModal({ products, onClose, onSubmit, isPending, onCreateProduct }: StockMovementFormModalProps) {
  const [form, setForm] = useState({ productId: '', type: 'entrada', quantity: '', reason: '' })
  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  const [barcode, setBarcode] = useState('')
  const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'notfound'>('idle')

  function searchBarcode(code: string) {
    const c = code.trim()
    if (!c) return
    const p = products.find((x: any) => x.barcode === c || x.code === c)
    if (p) {
      setForm(prev => ({ ...prev, productId: String(p.id) }))
      setBarcode('')
      setBarcodeStatus('idle')
    } else {
      setBarcodeStatus('notfound')
    }
  }

  return (
    <Modal title="Registrar movimiento de stock" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, productId: Number(form.productId), quantity: Number(form.quantity) }) }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Código de barras">
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ flex: 1 }}>
              <QRScannerField
                value={barcode}
                onChange={val => { setBarcode(val); setBarcodeStatus('idle') }}
                onScan={searchBarcode}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchBarcode(barcode) } }}
                placeholder="Escanear código..."
                label="Código de barras"
              />
            </div>
            <button type="button" onClick={() => searchBarcode(barcode)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Buscar
            </button>
          </div>
          {barcodeStatus === 'notfound' && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#dc2626' }}>
              Código "{barcode}" no encontrado.
              {onCreateProduct && (
                <button type="button" onClick={() => onCreateProduct(barcode)}
                  style={{ padding: '3px 10px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  + Crear producto
                </button>
              )}
            </div>
          )}
        </FormField>
        <FormField label="Producto">
          <SearchableSelect
            value={form.productId}
            onChange={val => setForm(prev => ({ ...prev, productId: val }))}
            options={products.map((p: any) => ({ value: String(p.id), label: `${p.name} (stock: ${p.stock})` }))}
            placeholder="Buscar producto..."
            emptyLabel="Seleccioná un producto"
          />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Tipo">
            <select style={inputStyle} value={form.type} onChange={f('type')}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste (setear stock)</option>
            </select>
          </FormField>
          <FormField label={form.type === 'ajuste' ? 'Nuevo stock' : 'Cantidad'}>
            <input style={inputStyle} type="number" min="0" value={form.quantity} onChange={f('quantity')} required />
          </FormField>
        </div>
        <FormField label="Motivo">
          <input style={inputStyle} value={form.reason} onChange={f('reason')} placeholder="Ej: compra a proveedor, devolución..." />
        </FormField>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>{isPending ? 'Guardando...' : 'Registrar'}</button>
        </div>
      </form>
    </Modal>
  )
}
