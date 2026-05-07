import { useState, useRef } from 'react'
import { btnSecondary } from '../ui/FormField'
import { api } from '../../lib/api'

interface PhotoUploadFieldProps {
  photoUrl: string
  onChange: (url: string) => void
}

export function PhotoUploadField({ photoUrl, onChange }: PhotoUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(res.data.url)
    } catch {
      alert('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      {photoUrl && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={photoUrl} alt="Preview"
            style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <button type="button" onClick={() => onChange('')}
            style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>
      )}
      <div style={{ flex: 1 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ ...btnSecondary, fontSize: '13px', padding: '8px 14px', width: '100%', justifyContent: 'center', opacity: uploading ? 0.6 : 1 }}>
          {uploading ? 'Subiendo...' : photoUrl ? '📷 Cambiar foto' : '📷 Subir foto'}
        </button>
        {!photoUrl && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>JPG, PNG hasta 5MB</p>}
      </div>
    </div>
  )
}
