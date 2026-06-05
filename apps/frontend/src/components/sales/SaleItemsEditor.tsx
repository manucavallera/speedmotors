import { useState } from 'react'
import { inputStyle, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { QRScannerField } from '../ui/QRScannerField'
import type { SaleItem } from '../../types/sales.types'
export type { SaleItem }

interface SaleItemsEditorProps {
  items: SaleItem[]
  products: any[]
  vehicles: any[]
  isMixto?: boolean
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, key: string, val: any) => void
  onBarcodeFound?: (product: any) => void
  onCreateProduct?: (barcode: string) => void
}

export function SaleItemsEditor({ items, products, vehicles, isMixto = false, onAdd, onRemove, onUpdate, onBarcodeFound, onCreateProduct }: SaleItemsEditorProps) {
  const [barcode, setBarcode] = useState('')
  const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'notfound'>('idle')

  function searchBarcode(code: string) {
    const c = code.trim()
    if (!c) return
    const cl = c.toLowerCase()
    const p = products.find((x: any) => x.barcode?.toLowerCase().trim() === cl || x.code?.toLowerCase().trim() === cl)
    if (p) {
      onBarcodeFound?.(p)
      setBarcode('')
      setBarcodeStatus('idle')
    } else {
      setBarcodeStatus('notfound')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0369a1', marginBottom: '6px' }}>Buscar por código de barras</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ flex: 1 }}>
            <QRScannerField
              value={barcode}
              onChange={val => { setBarcode(val); setBarcodeStatus('idle') }}
              onScan={searchBarcode}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchBarcode(e.currentTarget.value) } }}
              placeholder="Escanear o escribir código..."
              label="Código de barras"
            />
          </div>
          <button type="button" onClick={() => searchBarcode(barcode)}
            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Buscar
          </button>
        </div>
        {barcodeStatus === 'notfound' && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#dc2626' }}>
            Código "{barcode}" no encontrado.
            {onCreateProduct && (
              <button type="button" onClick={() => onCreateProduct(barcode)}
                style={{ padding: '3px 10px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                + Crear producto
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Productos / Vehículos / Servicios</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <SearchableSelect
                value={item.vehicleId ? `v:${item.vehicleId}` : item.productId ? `p:${item.productId}` : ''}
                onChange={val => {
                  if (!val) { onUpdate(i, 'vehicleId', undefined); onUpdate(i, 'productId', undefined); onUpdate(i, 'ingresoTipo', undefined); return }
                  if (val.startsWith('v:')) {
                    const v = vehicles.find((x: any) => x.id === Number(val.slice(2)))
                    if (v) { onUpdate(i, 'vehicleId', v.id); onUpdate(i, 'productId', undefined); onUpdate(i, 'description', `${v.brand} ${v.model} ${v.year || ''}`); onUpdate(i, 'unitPrice', Number(v.sellPrice)); onUpdate(i, 'ingresoTipo', v.ingresoTipo || '') }
                  } else {
                    const p = products.find((x: any) => x.id === Number(val.slice(2)))
                    if (p) { onUpdate(i, 'productId', p.id); onUpdate(i, 'vehicleId', undefined); onUpdate(i, 'description', p.name); onUpdate(i, 'unitPrice', Number(p.sellPrice)); onUpdate(i, 'ingresoTipo', p.ingresoTipo || '') }
                  }
                }}
                groups={[
                  ...(vehicles.length > 0 ? [{ label: '🏍️ Vehículos disponibles', options: vehicles.map((v: any) => ({ value: `v:${v.id}`, label: `${v.brand} ${v.model} ${v.year || ''} — $${Number(v.sellPrice).toLocaleString('es-AR')}` })) }] : []),
                  ...(products.length > 0 ? [{ label: '📦 Productos', options: products.map((p: any) => ({ value: `p:${p.id}`, label: `${p.name} — $${Number(p.sellPrice).toLocaleString('es-AR')}` })) }] : []),
                ]}
                placeholder="Buscar producto o vehículo..."
                emptyLabel="— Libre / Servicio —"
              />
              <input placeholder="Descripción" style={inputStyle} value={item.description} onChange={e => onUpdate(i, 'description', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 36px', gap: '8px', alignItems: 'center' }}>
              <input placeholder="Cant." type="number" min="1" style={inputStyle} value={item.quantity} onChange={e => onUpdate(i, 'quantity', e.target.value)} />
              <input placeholder="Precio unit." type="number" style={inputStyle} value={item.unitPrice} onChange={e => onUpdate(i, 'unitPrice', e.target.value)} />
              <button type="button" onClick={() => onRemove(i)} style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>×</button>
            </div>
            {isMixto ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Facturación:</span>
                <select style={{ ...inputStyle, maxWidth: '200px', fontSize: '12px', padding: '4px 8px' }}
                  value={item.ingresoTipo || ''}
                  onChange={e => onUpdate(i, 'ingresoTipo', e.target.value || undefined)}>
                  <option value="">Sin definir</option>
                  <option value="blanco">🧾 En blanco (con factura)</option>
                  <option value="negro">🤝 En negro (sin factura)</option>
                </select>
              </div>
            ) : item.ingresoTipo ? (
              <div style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', display: 'inline-block', alignSelf: 'flex-start',
                background: item.ingresoTipo === 'blanco' ? '#eff6ff' : '#fef9c3',
                color: item.ingresoTipo === 'blanco' ? '#1d4ed8' : '#854d0e' }}>
                Ingresó {item.ingresoTipo === 'blanco' ? '🧾 en blanco' : '🤝 en negro'}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} style={{ ...btnSecondary, marginTop: '8px', fontSize: '12px', padding: '6px 14px' }}>
        + Agregar ítem
      </button>
    </div>
  )
}
