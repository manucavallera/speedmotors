import { useState } from 'react'
import { useAlerts, useReminders, usePayInstallment } from '../hooks/useAlerts'
import type { CreateReminderData, Reminder } from '../hooks/useAlerts'
import { ReminderFormModal } from '../components/alerts/ReminderFormModal'
import { InfoBanner } from '../components/ui/InfoBanner'
import { AlertSummaryCards } from '../components/alerts/AlertSummaryCards'
import { AlertFilters } from '../components/alerts/AlertFilters'
import { AlertInstallmentCard } from '../components/alerts/AlertInstallmentCard'
import { AlertReminderCard } from '../components/alerts/AlertReminderCard'

function SectionBox({ border, children }: { border: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${border}`, padding: '20px 22px', marginBottom: '16px' }}>
      {children}
    </div>
  )
}

function SectionTitle({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>{label}</span>
      {count > 0 && <span style={{ background: color, color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 700, padding: '1px 8px' }}>{count}</span>}
    </div>
  )
}

function waLink(phone: string | null | undefined, msg: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const full = digits.startsWith('54') ? digits : `549${digits}`
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`
}

function WaButton({ phone, msg }: { phone: string | null | undefined; msg: string }) {
  const href = waLink(phone, msg)
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#25d366', color: 'white', borderRadius: '7px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
      💬 Enviar mensaje
    </a>
  )
}

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

type FilterType = 'todos' | 'cuotas' | 'recordatorios' | 'reservas' | 'ordenes'

export function AlertsPage() {
  const { data, isLoading } = useAlerts()
  const { create, update, markDone, remove } = useReminders()
  const payInstallment = usePayInstallment()
  const [modal, setModal] = useState<'new' | 'edit' | false>(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [search, setSearch] = useState('')

  function openEdit(r: Reminder) { setEditing(r); setModal('edit') }

  if (isLoading || !data) return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando alertas...</div>

  const { summary: s, installments: inst, creditInstallments: ci, cuentaCorriente: cc, reservations: res, purchaseOrders: po, reminders: rem } = data

  const q = search.toLowerCase()
  const filt = <T extends { clientName?: string | null; title?: string | null; supplierName?: string | null; brand?: string | null; model?: string | null }>(arr: T[]) =>
    q ? arr.filter(x => [x.clientName, x.title, x.supplierName, x.brand, x.model].some(v => v?.toLowerCase().includes(q))) : arr

  const show = (section: FilterType) => filter === 'todos' || filter === section

  return (
    <div style={{ maxWidth: '860px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Alertas y Vencimientos</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Centro de control de pagos, impuestos y fechas clave</p>
        </div>
        <button onClick={() => { setEditing(null); setModal('new') }}
          style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          + Nuevo recordatorio
        </button>
      </div>

      <InfoBanner title="Centro de alertas">
        Todo lo que necesitás atender hoy en un solo lugar. El sistema genera alertas automáticas para: <strong>cuotas vencidas o próximas a vencer</strong> (avisa 5 días antes), <strong>cuentas corrientes</strong> con saldo (vencidas, por vencer en 5 días y al día) — con botón para enviar recordatorio por WhatsApp al cliente, <strong>reservas</strong> sin concretar, y <strong>órdenes de compra</strong> pendientes de recepción. Usá <strong>"+ Nuevo recordatorio"</strong> para agendar cualquier cosa con fecha — pagos de impuestos, llamadas, vencimientos de seguros, lo que sea.
      </InfoBanner>

      <AlertSummaryCards summary={s} />
      <AlertFilters active={filter} onChange={setFilter} search={search} onSearch={setSearch} counts={{ cuotas: inst.overdue.length + inst.upcoming.length + (ci?.overdue.length ?? 0) + (ci?.upcoming.length ?? 0) + (cc?.overdue.length ?? 0) + (cc?.upcoming.length ?? 0) + (cc?.current.length ?? 0), recordatorios: rem.overdue.length + rem.upcoming.length + rem.pending.length, reservas: res.length, ordenes: po.length }} />

      {show('cuotas') && filt(inst.overdue).length > 0 && (
        <SectionBox border="#fecaca">
          <SectionTitle label="Cuotas vencidas" count={filt(inst.overdue).length} color="#dc2626" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(inst.overdue).map(i => <AlertInstallmentCard key={i.id} item={i} variant="overdue" onPay={id => payInstallment.mutate(id)} isPaying={payInstallment.isPending} />)}
          </div>
        </SectionBox>
      )}

      {show('cuotas') && filt(inst.upcoming).length > 0 && (
        <SectionBox border="#fde68a">
          <SectionTitle label="Cuotas próximas (5 días)" count={filt(inst.upcoming).length} color="#d97706" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(inst.upcoming).map(i => <AlertInstallmentCard key={i.id} item={i} variant="upcoming" onPay={id => payInstallment.mutate(id)} isPaying={payInstallment.isPending} />)}
          </div>
        </SectionBox>
      )}

      {show('cuotas') && ci && filt(ci.overdue).length > 0 && (
        <SectionBox border="#fecaca">
          <SectionTitle label="Cuotas de financiación vencidas" count={filt(ci.overdue).length} color="#dc2626" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(ci.overdue).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#fff5f5', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ width: '36px', height: '36px', background: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>#{c.number}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.clientName || 'Cliente'}</div>
                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>Cuota {c.number} · Venció {fmtDate(c.dueDate)}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '14px' }}>${Number(c.amount).toLocaleString('es-AR')}</div>
                <WaButton phone={c.clientPhone} msg={`Hola ${c.clientName || ''}, te recordamos que la cuota ${c.number} de tu financiación con SpeedMotors por $${Number(c.amount).toLocaleString('es-AR')} venció el ${fmtDate(c.dueDate)}. Te pedimos regularizar el pago. ¡Gracias!`} />
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      {show('cuotas') && ci && filt(ci.upcoming).length > 0 && (
        <SectionBox border="#fde68a">
          <SectionTitle label="Cuotas de financiación próximas (5 días)" count={filt(ci.upcoming).length} color="#d97706" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(ci.upcoming).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ width: '36px', height: '36px', background: '#d97706', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>#{c.number}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.clientName || 'Cliente'}</div>
                  <div style={{ fontSize: '12px', color: '#d97706' }}>Cuota {c.number} · Vence {fmtDate(c.dueDate)}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#d97706', fontSize: '14px' }}>${Number(c.amount).toLocaleString('es-AR')}</div>
                <WaButton phone={c.clientPhone} msg={`Hola ${c.clientName || ''}, te recordamos que la cuota ${c.number} de tu financiación con SpeedMotors por $${Number(c.amount).toLocaleString('es-AR')} vence el ${fmtDate(c.dueDate)}. ¡Gracias!`} />
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      {show('cuotas') && cc && filt(cc.overdue).length > 0 && (
        <SectionBox border="#fecaca">
          <SectionTitle label="Cuentas corrientes vencidas" count={filt(cc.overdue).length} color="#dc2626" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(cc.overdue).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#fff5f5', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ width: '36px', height: '36px', background: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>CC</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.clientName || 'Cliente'}</div>
                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>Venció {fmtDate(c.dueDate)}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '14px' }}>${Number(c.amount).toLocaleString('es-AR')}</div>
                <WaButton phone={c.clientPhone} msg={`Hola ${c.clientName || ''}, te recordamos que tu cuenta corriente con SpeedMotors por $${Number(c.amount).toLocaleString('es-AR')} venció el ${fmtDate(c.dueDate)}. Te pedimos regularizar el pago. ¡Gracias!`} />
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      {show('cuotas') && cc && filt(cc.upcoming).length > 0 && (
        <SectionBox border="#fde68a">
          <SectionTitle label="Cuentas corrientes próximas (5 días)" count={filt(cc.upcoming).length} color="#d97706" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(cc.upcoming).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ width: '36px', height: '36px', background: '#d97706', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>CC</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.clientName || 'Cliente'}</div>
                  <div style={{ fontSize: '12px', color: '#d97706' }}>Vence {fmtDate(c.dueDate)}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#d97706', fontSize: '14px' }}>${Number(c.amount).toLocaleString('es-AR')}</div>
                <WaButton phone={c.clientPhone} msg={`Hola ${c.clientName || ''}, te recordamos que tu cuenta corriente con SpeedMotors por $${Number(c.amount).toLocaleString('es-AR')} vence el ${fmtDate(c.dueDate)}. ¡Gracias!`} />
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      {show('cuotas') && cc && filt(cc.current).length > 0 && (
        <SectionBox border="#e2e8f0">
          <SectionTitle label="Cuentas corrientes al día" count={filt(cc.current).length} color="#64748b" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(cc.current).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '36px', height: '36px', background: '#64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>CC</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.clientName || 'Cliente'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{c.dueDate ? `Vence ${fmtDate(c.dueDate)}` : 'Sin vencimiento'}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>${Number(c.amount).toLocaleString('es-AR')}</div>
                <WaButton phone={c.clientPhone} msg={`Hola ${c.clientName || ''}, te recordamos que tenés un saldo de $${Number(c.amount).toLocaleString('es-AR')} en tu cuenta corriente con SpeedMotors${c.dueDate ? `, con vencimiento el ${fmtDate(c.dueDate)}` : ''}. ¡Gracias!`} />
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      {show('reservas') && filt(res).length > 0 && (
        <SectionBox border="#ddd6fe">
          <SectionTitle label="Reservas vigentes +30 días" count={filt(res).length} color="#7c3aed" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(res).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                <div style={{ width: '36px', height: '36px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', flexShrink: 0 }}>🏍️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{r.clientName} · {r.brand} {r.model || ''}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Reserva {r.reservationNumber || '#' + r.id} · Creada {new Date(r.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                {r.depositAmount && <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '14px' }}>Seña ${Number(r.depositAmount).toLocaleString('es-AR')}</div>}
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      {show('ordenes') && filt(po).length > 0 && (
        <SectionBox border="#bae6fd">
          <SectionTitle label="Órdenes de compra pendientes" count={filt(po).length} color="#0284c7" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(po).map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ width: '36px', height: '36px', background: '#0284c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', flexShrink: 0 }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{o.supplierName || 'Proveedor sin nombre'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>OC #{o.id} · {o.status}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#0284c7', fontSize: '14px' }}>${Number(o.total).toLocaleString('es-AR')}</div>
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      {show('recordatorios') && filt(rem.overdue).length > 0 && (
        <SectionBox border="#fecaca">
          <SectionTitle label="Recordatorios vencidos" count={filt(rem.overdue).length} color="#dc2626" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(rem.overdue).map(r => <AlertReminderCard key={r.id} item={r} onEdit={openEdit} onMarkDone={id => markDone.mutate(id)} onDelete={id => { if (window.confirm('¿Eliminar este recordatorio?')) remove.mutate(id) }} />)}
          </div>
        </SectionBox>
      )}

      {show('recordatorios') && filt(rem.upcoming).length > 0 && (
        <SectionBox border="#fde68a">
          <SectionTitle label="Recordatorios próximos 7 días" count={filt(rem.upcoming).length} color="#d97706" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filt(rem.upcoming).map(r => <AlertReminderCard key={r.id} item={r} onEdit={openEdit} onMarkDone={id => markDone.mutate(id)} onDelete={id => { if (window.confirm('¿Eliminar este recordatorio?')) remove.mutate(id) }} />)}
          </div>
        </SectionBox>
      )}

      {show('recordatorios') && (
        <SectionBox border="#f1f5f9">
          <SectionTitle label="Mis recordatorios" count={filt(rem.pending).length} color="#475569" />
          {filt(rem.pending).length > 0
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{filt(rem.pending).map(r => <AlertReminderCard key={r.id} item={r} onEdit={openEdit} onMarkDone={id => markDone.mutate(id)} onDelete={id => { if (window.confirm('¿Eliminar este recordatorio?')) remove.mutate(id) }} />)}</div>
            : <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '13.5px' }}>Sin recordatorios pendientes.</div>
          }
        </SectionBox>
      )}

      {modal && (
        <ReminderFormModal
          mode={modal} editing={editing}
          onClose={() => { setModal(false); setEditing(null) }}
          onSubmit={d => {
            if (modal === 'edit' && editing) update.mutate({ id: editing.id, data: d }, { onSuccess: () => { setModal(false); setEditing(null) } })
            else create.mutate(d as CreateReminderData, { onSuccess: () => setModal(false) })
          }}
          isPending={create.isPending || update.isPending}
        />
      )}
    </div>
  )
}
