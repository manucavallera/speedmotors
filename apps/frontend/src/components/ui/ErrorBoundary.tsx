import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '32px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Algo salió mal</div>
        <div style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontFamily: 'monospace', maxWidth: '600px', wordBreak: 'break-word' }}>
          {this.state.error.message}
        </div>
        <button
          onClick={() => { this.setState({ error: null }); window.location.reload() }}
          style={{ padding: '8px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
          Recargar
        </button>
      </div>
    )
  }
}
