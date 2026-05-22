import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface QRScannerFieldProps {
  value: string
  onChange: (val: string) => void
  onScan?: (val: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  label?: string
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px',
  fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'inherit', background: '#fff',
}

export function QRScannerField({ value, onChange, onScan, onKeyDown, placeholder, label }: QRScannerFieldProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    if (!scanning) return
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
      if (result) {
        const text = result.getText()
        onChange(text)
        onScan?.(text)
        stopScanner()
      }
      if (err && !(err.message?.includes('No MultiFormat'))) {
        setError('Error de cámara')
      }
    }).catch(() => setError('No se pudo acceder a la cámara'))

    return () => stopScanner()
  }, [scanning])

  function stopScanner() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    readerRef.current = null
    setScanning(false)
    setError('')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          style={inputStyle}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setScanning(true)}
          title="Escanear QR / código de barras"
          style={{
            flexShrink: 0, padding: '8px 10px', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: '#f8fafc',
            cursor: 'pointer', fontSize: '16px', lineHeight: 1,
          }}
        >
          📷
        </button>
      </div>

      {scanning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            {label ? `Escaneando: ${label}` : 'Apuntá la cámara al código'}
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', height: '240px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #3b82f6' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted playsInline />
            <div style={{
              position: 'absolute', inset: 0, border: '2px solid rgba(59,130,246,0.5)',
              margin: '20px', borderRadius: '8px', pointerEvents: 'none',
            }} />
          </div>
          {error && <div style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</div>}
          <button
            type="button"
            onClick={stopScanner}
            style={{
              padding: '10px 28px', borderRadius: '8px', border: 'none',
              background: '#dc2626', color: '#fff', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px',
            }}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
