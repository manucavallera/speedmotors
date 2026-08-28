import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { toast } from '../lib/toast'
import { InfoBanner } from '../components/ui/InfoBanner'
import { FormField, inputStyle, btnPrimary } from '../components/ui/FormField'

export function ResalesPage() {
  const qc = useQueryClient()
  const [name, setName] = useState(''); const [phone, setPhone] = useState('')
  const [vehicleId, setVehicleId] = useState(''); const [resellerId, setResellerId] = useState(''); const [agreedPrice, setAgreedPrice] = useState('')
  const { data: resellers = [], isLoading } = useQuery<any[]>({ queryKey: ['resales'], queryFn: () => api.get('/resales').then(r => r.data) })
  const { data: vehiclesData } = useQuery<any>({ queryKey: ['vehicles', 'resale-available'], queryFn: () => api.get('/vehicles', { params: { type: 'moto', status: 'disponible', limit: 500 } }).then(r => r.data) })
  const vehicles = vehiclesData?.items ?? []; const refresh = () => qc.invalidateQueries({ queryKey: ['resales'] })
  const createReseller = useMutation({ mutationFn: () => api.post('/resales/resellers', { name, phone }), onSuccess: () => { setName(''); setPhone(''); refresh() }, onError: e => toast.error(apiError(e)) })
  const consign = useMutation({ mutationFn: () => api.post('/resales/consignments', { resellerId: Number(resellerId), vehicleId: Number(vehicleId), agreedPrice: Number(agreedPrice) }), onSuccess: () => { setVehicleId(''); setAgreedPrice(''); refresh(); qc.invalidateQueries({ queryKey: ['vehicles'] }) }, onError: e => toast.error(apiError(e)) })
  const sold = useMutation({ mutationFn: ({ id, price }: { id: number; price: number }) => api.post(`/resales/consignments/${id}/sold`, { soldPrice: price }), onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ['vehicles'] }) }, onError: e => toast.error(apiError(e)) })
  return <div>
    <div className="page-header"><div><h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Reventas</h1><p style={{ color: '#64748b', fontSize: '14px' }}>Motos en consignación</p></div></div>
    <InfoBanner title="Consignación"><strong>Reventa</strong> son los negocios que reciben motos y pagan cuando las venden.</InfoBanner>
    <div className="form-grid-2" style={{ marginBottom: '18px' }}>
      <form onSubmit={e => { e.preventDefault(); createReseller.mutate() }} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}><h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>Nuevo reventa</h3><FormField label="Nombre del negocio"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required /></FormField><FormField label="Teléfono"><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} /></FormField><button style={btnPrimary} disabled={createReseller.isPending}>Guardar negocio</button></form>
      <form onSubmit={e => { e.preventDefault(); consign.mutate() }} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}><h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>Entregar moto en consignación</h3><FormField label="Reventa"><select style={inputStyle} value={resellerId} onChange={e => setResellerId(e.target.value)} required><option value="">Seleccionar...</option>{resellers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></FormField><FormField label="Moto disponible"><select style={inputStyle} value={vehicleId} onChange={e => setVehicleId(e.target.value)} required><option value="">Seleccionar...</option>{vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.internalCode || `#${v.id}`}</option>)}</select></FormField><FormField label="Precio acordado"><input style={inputStyle} type="number" min="0" value={agreedPrice} onChange={e => setAgreedPrice(e.target.value)} required /></FormField><button style={btnPrimary} disabled={consign.isPending}>Entregar moto</button></form>
    </div>
    {isLoading ? <p>Cargando...</p> : resellers.map(r => <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}><div style={{ fontWeight: 700, color: '#0f172a' }}>{r.name} {r.phone && <span style={{ color: '#64748b', fontWeight: 400 }}>· {r.phone}</span>}</div>{r.consignments.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin motos consignadas.</p> : r.consignments.map((c: any) => <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}><span>{c.vehicle?.brand} {c.vehicle?.model} · ${Number(c.agreedPrice).toLocaleString('es-AR')} {c.soldAt ? <strong style={{ color: '#16a34a' }}>· Vendida</strong> : <span style={{ color: '#d97706' }}>· Consignada</span>}</span>{!c.soldAt && <button style={{ ...btnPrimary, padding: '6px 10px', fontSize: '12px' }} onClick={() => { const value = window.prompt('Importe de venta', c.agreedPrice); if (value) sold.mutate({ id: c.id, price: Number(value) }) }}>Registrar venta</button>}</div>)}</div>)}
  </div>
}
