import { Modal } from './Modal'

export interface HelpSection {
  h: string
  items: string[]
}

interface Props {
  title: string
  sections: HelpSection[]
  onClose: () => void
}

// Guía de uso de una sección. Texto plano, pensado para el usuario final.
export function HelpModal({ title, sections, onClose }: Props) {
  return (
    <Modal title={title} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {sections.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1d4ed8', marginBottom: '7px' }}>{s.h}</div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {s.items.map((it, j) => (
                <li key={j} style={{ fontSize: '13px', color: '#334155', lineHeight: 1.45 }}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// Botón "?" estándar para abrir la guía desde el header de cada página
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Cómo funciona esta sección"
      style={{
        width: '34px', height: '34px', borderRadius: '9px', border: '1px solid #e2e8f0', background: 'white',
        cursor: 'pointer', fontSize: '15px', fontWeight: 700, color: '#1d4ed8', lineHeight: 1,
      }}
    >?</button>
  )
}
