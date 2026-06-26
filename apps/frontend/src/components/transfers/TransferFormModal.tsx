import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { api } from '../../lib/api'
import type { Transfer, CreateTransferData } from '../../hooks/useTransfers'

interface Props {
  editing?: Transfer | null
  onClose: () => void
  onSubmit: (data: CreateTransferData) => void
  isPending: boolean
}

const empty = (): CreateTransferData => ({
  clientName: '', clientDni: '', date: new Date().toISOString().split('T')[0],
  notaryName: '', notaryRegistry: '', rnpNumber: '', dnrpaNumber: '',
  transferFee: 0, taxAmount: 0, totalCost: 0, status: 'pendiente', notes: '',
})

function toForm(t?: Transfer | null): CreateTransferData {
  if (!t) return empty()
  return {
    vehicleId: t.vehicleId ?? undefined,
    clientId: t.clientId ?? undefined,
    clientName: t.clientName,
    clientDni: t.clientDni ?? '',
    date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0],
    notaryName: t.notaryName ?? '',
    notaryRegistry: t.notaryRegistry ?? '',
    rnpNumber: t.rnpNumber ?? '',
    dnrpaNumber: t.dnrpaNumber ?? '',
    transferFee: Number(t.transferFee ?? 0),
    taxAmount: Number(t.taxAmount ?? 0),
    totalCost: Number(t.totalCost ?? 0),
    status: t.status,
    notes: t.notes ?? '',
  }
}

const statusLabels = { pendiente: 'Pendiente', en_tramite: 'En trámite', completada: 'Completada', cancelada: 'Cancelada' }

export function TransferFormModal({ editing, onClose, onSubmit, isPending }: Props) {
  const [form, setForm] = useState<CreateTransferData>(toForm(editing))
  useEffect(() => { setForm(toForm(editing)) }, [editing?.id])

  const set = (k: keyof CreateTransferData, v: CreateTransferData[typeof k]) => setForm(f => ({ ...f, [k]: v }))

  const { data: vehiclesData } = useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('/vehicles').then(r => r.data) })
  const vehicles = vehiclesData?.items ?? vehiclesData ?? []
  const { data: clientsData } = useQuery({ queryKey: ['clients'], queryFn: () => api.get('/clients', { params: { type: 'concesionaria' } }).then(r => r.data) })
  const clients = clientsData?.items ?? clientsData ?? []

  function handleVehicleChange(id: string) {
    const v = (vehicles as any[]).find((v: any) => v.id === Number(id))
    set('vehicleId', id ? Number(id) : undefined)
    if (v) { /* auto-fill chassis in detail, read-only */ }
  }

  function handleClientChange(id: string) {
    const c = (clients as any[]).find((c: any) => c.id === Number(id))
    set('clientId', id ? Number(id) : undefined)
    if (c) { set('clientName', c.name); set('clientDni', c.dni ?? '') }
  }

  function handleFeeChange(fee: number, tax: number) {
    set('transferFee', fee)
    set('taxAmount', tax)
    set('totalCost', fee + tax)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  const title = editing ? `Editar transferencia ${editing.transferNumber ?? ''}` : 'Nueva transferencia de dominio'

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="Vehículo">
            <SearchableSelect
              value={form.vehicleId ? String(form.vehicleId) : ''}
              onChange={handleVehicleChange}
              options={(vehicles as any[]).map((v: any) => ({ value: String(v.id), label: `${v.brand} ${v.model} ${v.year} — ${v.chassisNumber ?? 'sin chasis'}` }))}
              placeholder="Buscar vehículo..."
              emptyLabel="— Seleccionar —"
            />
          </FormField>
          <FormField label="Fecha de transferencia">
            <input type="date" value={form.date ?? ''} onChange={e => set('date', e.target.value)} style={inputStyle} required />
          </FormField>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del comprador</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Cliente (opcional)">
              <SearchableSelect
                value={form.clientId ? String(form.clientId) : ''}
                onChange={handleClientChange}
                options={(clients as any[]).map((c: any) => ({ value: String(c.id), label: c.name }))}
                placeholder="Buscar cliente..."
                emptyLabel="— Cargar manual —"
              />
            </FormField>
            <FormField label="DNI comprador">
              <input value={form.clientDni ?? ''} onChange={e => set('clientDni', e.target.value)} style={inputStyle} placeholder="28.456.789" />
            </FormField>
          </div>
          <FormField label="Nombre completo comprador">
            <input value={form.clientName} onChange={e => set('clientName', e.target.value)} style={inputStyle} required placeholder="Juan Pablo Gómez" />
          </FormField>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos registrales</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Escribano / Gestor">
              <input value={form.notaryName ?? ''} onChange={e => set('notaryName', e.target.value)} style={inputStyle} placeholder="Dr. Carlos Fernández" />
            </FormField>
            <FormField label="Registro notarial / gestora">
              <input value={form.notaryRegistry ?? ''} onChange={e => set('notaryRegistry', e.target.value)} style={inputStyle} placeholder="Reg. 42, Paraná" />
            </FormField>
            <FormField label="N° informe RNP">
              <input value={form.rnpNumber ?? ''} onChange={e => set('rnpNumber', e.target.value)} style={inputStyle} placeholder="RNP-2026-XXXXX" />
            </FormField>
            <FormField label="N° trámite DNRPA">
              <input value={form.dnrpaNumber ?? ''} onChange={e => set('dnrpaNumber', e.target.value)} style={inputStyle} placeholder="TR-XXXXXXXX" />
            </FormField>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <FormField label="Honorarios escribano ($)">
            <input type="number" min="0" value={form.transferFee ?? 0}
              onChange={e => handleFeeChange(Number(e.target.value), form.taxAmount ?? 0)}
              style={inputStyle} />
          </FormField>
          <FormField label="Impuesto de sellos ($)">
            <input type="number" min="0" value={form.taxAmount ?? 0}
              onChange={e => handleFeeChange(form.transferFee ?? 0, Number(e.target.value))}
              style={inputStyle} />
          </FormField>
          <FormField label="Total costos ($)">
            <input type="number" value={form.totalCost ?? 0} readOnly style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b' }} />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="Estado">
            <select value={form.status ?? 'pendiente'} onChange={e => set('status', e.target.value as Transfer['status'])} style={inputStyle}>
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Observaciones">
          <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
            style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} placeholder="Detalles adicionales..." />
        </FormField>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={isPending} style={btnPrimary}>{isPending ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear transferencia'}</button>
        </div>
      </form>
    </Modal>
  )
}
