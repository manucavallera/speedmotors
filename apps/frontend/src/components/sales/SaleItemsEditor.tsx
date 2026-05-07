import { inputStyle, btnSecondary } from '../ui/FormField'
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
}

export function SaleItemsEditor({ items, products, vehicles, isMixto = false, onAdd, onRemove, onUpdate }: SaleItemsEditorProps) {
  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Productos / Vehículos / Servicios</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select style={inputStyle} value={item.vehicleId ? `v:${item.vehicleId}` : item.productId ? `p:${item.productId}` : ''}
                onChange={e => {
                  const val = e.target.value
                  if (!val) { onUpdate(i, 'vehicleId', undefined); onUpdate(i, 'productId', undefined); onUpdate(i, 'ingresoTipo', undefined); return }
                  if (val.startsWith('v:')) {
                    const v = vehicles.find((x: any) => x.id === Number(val.slice(2)))
                    if (v) { onUpdate(i, 'vehicleId', v.id); onUpdate(i, 'productId', undefined); onUpdate(i, 'description', `${v.brand} ${v.model} ${v.year || ''}`); onUpdate(i, 'unitPrice', Number(v.sellPrice)); onUpdate(i, 'ingresoTipo', v.ingresoTipo || '') }
                  } else {
                    const p = products.find((x: any) => x.id === Number(val.slice(2)))
                    if (p) { onUpdate(i, 'productId', p.id); onUpdate(i, 'vehicleId', undefined); onUpdate(i, 'description', p.name); onUpdate(i, 'unitPrice', Number(p.sellPrice)); onUpdate(i, 'ingresoTipo', p.ingresoTipo || '') }
                  }
                }}>
                <option value="">— Libre / Servicio —</option>
                {vehicles.length > 0 && <optgroup label="🏍️ Vehículos disponibles">
                  {vehicles.map((v: any) => <option key={`v:${v.id}`} value={`v:${v.id}`}>{v.brand} {v.model} {v.year || ''} — ${Number(v.sellPrice).toLocaleString('es-AR')}</option>)}
                </optgroup>}
                {products.length > 0 && <optgroup label="📦 Productos">
                  {products.map((p: any) => <option key={`p:${p.id}`} value={`p:${p.id}`}>{p.name} — ${Number(p.sellPrice).toLocaleString('es-AR')}</option>)}
                </optgroup>}
              </select>
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
