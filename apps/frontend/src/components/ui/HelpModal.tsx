import { Modal } from './Modal'

export interface HelpSection {
  group?: string
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
            {s.group && s.group !== sections[i - 1]?.group && (
              <div style={{ padding: '9px 11px', marginBottom: '12px', borderRadius: '8px', background: '#eff6ff', color: '#1e40af', fontSize: '12px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {s.group}
              </div>
            )}
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

// Botón visible para abrir la guía desde el header de cada página.
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Cómo funciona esta sección"
      aria-label="Abrir guía de uso"
      style={{
        height: '36px', padding: '0 12px', borderRadius: '9px', border: '1px solid #bfdbfe', background: '#eff6ff',
        cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap',
      }}
    >?&nbsp; Guía de uso</button>
  )
}
