import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import type { AppUser } from '../../hooks/useUsers'

interface Props {
  user: AppUser
  onClose: () => void
  onSubmit: (password: string) => void
  isPending: boolean
}

export function ChangePasswordModal({ user, onClose, onSubmit, isPending }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    onSubmit(password)
  }

  return (
    <Modal title={`Cambiar contraseña — ${user.name}`} onClose={onClose} width={400}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Nueva contraseña">
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
            style={inputStyle} required minLength={6} autoFocus />
        </FormField>
        <FormField label="Confirmar contraseña">
          <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
            style={inputStyle} required />
        </FormField>
        {error && <div style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: 600 }}>{error}</div>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={isPending} style={btnPrimary}>{isPending ? 'Guardando...' : 'Cambiar contraseña'}</button>
        </div>
      </form>
    </Modal>
  )
}
