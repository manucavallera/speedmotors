import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      navigate('/')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Panel izquierdo */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        color: 'white',
      }}
        className="hidden lg:flex"
      >
        <div style={{ maxWidth: '380px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '32px', boxShadow: '0 8px 32px rgba(59,130,246,0.4)'
          }}>
            🏍️
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.2 }}>
            Speed Motors
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6 }}>
            Sistema de gestión de stock, facturación y clientes para tu negocio.
          </p>
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Control de stock en tiempo real', 'Motos y lanchas con N° de chasis', 'Ventas en cuotas con interés', 'Lista de precios PDF'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '14px' }}>
                <span style={{ color: '#3b82f6', fontSize: '16px' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px', background: '#f8fafc', width: '100%', maxWidth: '380px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ marginBottom: '36px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}>
              🏍️
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Bienvenido
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Ingresá a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@speedmotors.com"
                required
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  background: 'white', color: '#0f172a', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  background: 'white', color: '#0f172a', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600,
                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
