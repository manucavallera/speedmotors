// @file: ProductFormModal.tsx | Form create/edit producto. Maneja form state y photo upload internamente.
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { PhotoUploadField } from './PhotoUploadField'
import { QRScannerField } from '../ui/QRScannerField'
import type { ProductForm } from '../../types/products.types'
import { emptyProductForm } from '../../types/products.types'

interface ProductFormModalProps {
  mode: 'create' | 'edit'
  editing: any | null
  onClose: () => void
  onSubmit: (data: any) => void
  isPending: boolean
}

function toForm(p: any): ProductForm {
  return {
    code: p.code, name: p.name, brand: p.brand || '',
    costPrice: p.costPrice, sellPrice: p.sellPrice,
    stock: String(p.stock), minStock: String(p.minStock), unit: p.unit || 'U',
    photoUrl: p.photoUrl || '', serialNumber: p.serialNumber || '', ingresoTipo: p.ingresoTipo || '',
  }
}

export function ProductFormModal({ mode, editing, onClose, onSubmit, isPending }: ProductFormModalProps) {
  const [form, setForm] = useState<ProductForm>(() => editing ? toForm(editing) : emptyProductForm)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      photoUrl: form.photoUrl || null,
      serialNumber: form.serialNumber || null,
    })
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="form-grid-2">
          <FormField label="Código">
            <QRScannerField value={form.code} onChange={val => setForm(f => ({ ...f, code: val }))} label="Código de producto" placeholder="Escanear o ingresar" />
          </FormField>
          <FormField label="Marca">
            <input style={inputStyle} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Nombre">
          <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </FormField>
        <div className="form-grid-2">
          <FormField label="Precio de costo ($)">
            <input style={inputStyle} type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} required />
          </FormField>
          <FormField label="Precio de venta ($)">
            <input style={inputStyle} type="number" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} required />
          </FormField>
        </div>
        {form.costPrice && form.sellPrice && Number(form.costPrice) > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#475569' }}>
            Ganancia: <strong style={{ color: '#16a34a' }}>
              {((Number(form.sellPrice) - Number(form.costPrice)) / Number(form.costPrice) * 100).toFixed(1)}%
            </strong>
            {' '}(${(Number(form.sellPrice) - Number(form.costPrice)).toLocaleString('es-AR')} por unidad)
          </div>
        )}
        <div className="form-grid-3">
          <FormField label={mode === 'edit' ? 'Stock actual (solo lectura)' : 'Stock inicial'}>
            <input
              style={{ ...inputStyle, background: mode === 'edit' ? '#f1f5f9' : 'white', color: mode === 'edit' ? '#64748b' : '#0f172a', cursor: mode === 'edit' ? 'not-allowed' : 'text' }}
              type="number" value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
              disabled={mode === 'edit'} required={mode !== 'edit'}
            />
          </FormField>
          <FormField label="Stock mínimo">
            <input style={inputStyle} type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
          </FormField>
          <FormField label="Unidad">
            <input style={inputStyle} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
          </FormField>
        </div>
        {mode === 'edit' && (
          <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px', color: '#1e40af' }}>
            Para modificar el stock, usá <strong>Movimientos de stock</strong>. Así queda registrado el motivo del cambio.
          </div>
        )}
        <div className="form-grid-2">
          <FormField label="Número de serie">
            <input style={inputStyle} value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="Opcional" />
          </FormField>
          <FormField label="Ingreso">
            <select style={inputStyle} value={form.ingresoTipo} onChange={e => setForm(f => ({ ...f, ingresoTipo: e.target.value }))}>
              <option value="">Sin especificar</option>
              <option value="blanco">🧾 En blanco (con factura)</option>
              <option value="negro">🤝 En negro (sin factura)</option>
            </select>
          </FormField>
        </div>
        <FormField label="Foto del producto">
          <PhotoUploadField photoUrl={form.photoUrl} onChange={url => setForm(f => ({ ...f, photoUrl: url }))} />
        </FormField>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
