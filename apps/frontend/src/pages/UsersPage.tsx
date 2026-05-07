import { useState } from 'react'
import { useUsers } from '../hooks/useUsers'
import type { AppUser } from '../hooks/useUsers'
import { UserFormModal } from '../components/users/UserFormModal'
import { ChangePasswordModal } from '../components/users/ChangePasswordModal'
import { useAuth } from '../hooks/useAuth'

const roleStyle = {
  admin:    { bg: '#ede9fe', color: '#7c3aed', label: 'Admin' },
  vendedor: { bg: '#dbeafe', color: '#2563eb', label: 'Vendedor' },
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) }

export function UsersPage() {
  const { user: me } = useAuth()
  const { list, create, update, changePassword, remove } = useUsers()
  const [modal, setModal] = useState<'new' | 'edit' | 'password' | null>(null)
  const [selected, setSelected] = useState<AppUser | null>(null)

  const users = list.data ?? []

  function openEdit(u: AppUser) { setSelected(u); setModal('edit') }
  function openPassword(u: AppUser) { setSelected(u); setModal('password') }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Usuarios</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Gestión de accesos al sistema</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('new') }}
          style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          + Nuevo usuario
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Usuario', 'Email', 'Rol', 'Desde', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</td></tr>
            )}
            {users.map((u, i) => {
              const rs = roleStyle[u.role]
              const isMe = u.email === me.email
              return (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                        {u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{u.name}</div>
                        {isMe && <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Vos</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13.5px', color: '#374151' }}>{u.email}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ background: rs.bg, color: rs.color, fontSize: '11.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>{rs.label}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#64748b' }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(u)}
                        style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600, background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => openPassword(u)}
                        style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer' }}>
                        Contraseña
                      </button>
                      {!isMe && (
                        <button onClick={() => { if (confirm(`¿Eliminar usuario ${u.name}?`)) remove.mutate(u.id) }}
                          style={{ padding: '4px 8px', fontSize: '13px', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                          ×
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal === 'new' && (
        <UserFormModal editing={null} onClose={() => setModal(null)}
          onSubmit={d => create.mutate(d, { onSuccess: () => setModal(null) })}
          isPending={create.isPending} />
      )}
      {modal === 'edit' && selected && (
        <UserFormModal editing={selected} onClose={() => setModal(null)}
          onSubmit={d => update.mutate({ id: selected.id, data: d }, { onSuccess: () => setModal(null) })}
          isPending={update.isPending} />
      )}
      {modal === 'password' && selected && (
        <ChangePasswordModal user={selected} onClose={() => setModal(null)}
          onSubmit={p => changePassword.mutate({ id: selected.id, password: p }, { onSuccess: () => setModal(null) })}
          isPending={changePassword.isPending} />
      )}
    </div>
  )
}
