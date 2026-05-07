import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import type { AppUser } from '../../hooks/useUsers'

interface Props {
  editing?: AppUser | null
  onClose: () => void
  onSubmit: (data: any) => void
  isPending: boolean
}

export function UserFormModal({ editing, onClose, onSubmit, isPending }: Props) {
  const [name, setName] = useState(editing?.name ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [role, setRole] = useState<'admin' | 'vendedor'>(editing?.role ?? 'vendedor')
  const [password, setPassword] = useState('')

  useEffect(() => {
    setName(editing?.name ?? '')
    setEmail(editing?.email ?? '')
    setRole(editing?.role ?? 'vendedor')
    setPassword('')
  }, [editing?.id])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const data: any = { name, email, role }
    if (!editing) data.password = password
    onSubmit(data)
  }

  return (
    <Modal title={editing ? `Editar usuario — ${editing.name}` : 'Nuevo usuario'} onClose={onClose} width={440}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Nombre completo">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required placeholder="Juan Pérez" />
        </FormField>
        <FormField label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required placeholder="juan@speedmotors.com" />
        </FormField>
        <FormField label="Rol">
          <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'vendedor')} style={inputStyle}>
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
        </FormField>
        {!editing && (
          <FormField label="Contraseña">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required minLength={6} placeholder="Mínimo 6 caracteres" />
          </FormField>
        )}
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px', color: '#64748b' }}>
          {role === 'admin' ? '⚠ Admin: acceso completo incluyendo gestión de usuarios y reportes.' : 'Vendedor: acceso a ventas, clientes, stock. Sin acceso a reportes financieros ni usuarios.'}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={isPending} style={btnPrimary}>{isPending ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  )
}
