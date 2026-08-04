import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary } from './FormField'

interface Props {
  title: string
  value: string
  valueLabel?: string
  subtitle?: string
  secondValue?: string
  secondLabel?: string
  onClose: () => void
}

function QRBlock({ label, value, color = '#0f172a' }: { label: string; value: string; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, { width: 180, margin: 2, color: { dark: color, light: '#ffffff' } })
    QRCode.toDataURL(value, { width: 180, margin: 2, color: { dark: color, light: '#ffffff' } }).then(setDataUrl)
  }, [value, color])

  function download() {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${label.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{ padding: '12px', background: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color, textAlign: 'center' }}>{label}</div>
      <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', textAlign: 'center', wordBreak: 'break-all' }}>{value}</div>
      <button onClick={download} style={{ ...btnSecondary, fontSize: '11px', padding: '5px 12px' }}>Descargar</button>
    </div>
  )
}

export function QRModal({ title, value, valueLabel = 'N° de chasis', subtitle, secondValue, secondLabel, onClose }: Props) {
  const [allDataUrls, setAllDataUrls] = useState<string[]>([])

  useEffect(() => {
    const values = [value, ...(secondValue ? [secondValue] : [])]
    Promise.all(values.map(v => QRCode.toDataURL(v, { width: 180, margin: 2 }))).then(setAllDataUrls)
  }, [value, secondValue])

  function printAll() {
    const win = window.open('', '_blank')!
    const blocks = [
      { label: valueLabel, val: value, url: allDataUrls[0] },
      ...(secondValue && allDataUrls[1] ? [{ label: secondLabel || 'Código importación', val: secondValue, url: allDataUrls[1] }] : []),
    ]
    win.document.write(`
      <html><head><title>QR - ${title}</title>
      <style>
        body{display:flex;flex-direction:column;align-items:center;font-family:system-ui;padding:24px;gap:16px}
        h2{font-size:16px;color:#0f172a;margin:0}
        .row{display:flex;gap:32px;justify-content:center}
        .block{display:flex;flex-direction:column;align-items:center;gap:6px}
        .lbl{font-size:11px;font-weight:600;color:#374151}
        .val{font-size:9px;color:#94a3b8;font-family:monospace}
      </style></head>
      <body>
        <h2>${title}</h2>
        ${subtitle ? `<p style="font-size:12px;color:#64748b;margin:0">${subtitle}</p>` : ''}
        <div class="row">
          ${blocks.map(b => `<div class="block"><img src="${b.url}" width="160"/><div class="lbl">${b.label}</div><div class="val">${b.val}</div></div>`).join('')}
        </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const dual = !!secondValue

  return (
    <Modal title={`QR — ${title}`} onClose={onClose} width={dual ? 480 : 340}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {subtitle && (
          <div style={{ fontSize: '13px', color: '#64748b' }}>{subtitle}</div>
        )}
        <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center' }}>
          <QRBlock label={valueLabel} value={value} color="#0f172a" />
          {secondValue && <QRBlock label={secondLabel || 'Cód. importación'} value={secondValue} color="#7c3aed" />}
        </div>
        <button onClick={printAll} style={{ ...btnPrimary, width: '100%', textAlign: 'center' }}>Imprimir</button>
      </div>
    </Modal>
  )
}
