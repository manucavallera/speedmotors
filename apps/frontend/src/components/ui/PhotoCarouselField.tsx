import { useRef, useState } from 'react'
import { api } from '../../lib/api'
import { btnSecondary } from './FormField'

interface PhotoCarouselFieldProps {
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos?: number
}

export function PhotoCarouselField({ photos, onChange, maxPhotos = 6 }: PhotoCarouselFieldProps) {
  const [current, setCurrent] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(async file => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        return res.data.url as string
      }))
      const next = [...photos, ...urls].slice(0, maxPhotos)
      onChange(next)
      setCurrent(next.length - 1)
    } catch {
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function remove(idx: number) {
    const next = photos.filter((_, i) => i !== idx)
    onChange(next)
    setCurrent(Math.min(current, next.length - 1))
  }

  const hasPrev = current > 0
  const hasNext = current < photos.length - 1

  return (
    <div>
      {photos.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <img
            src={photos[current]}
            alt={`Foto ${current + 1}`}
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).src = '' }}
          />
          {/* Nav arrows */}
          {hasPrev && (
            <button type="button" onClick={() => setCurrent(c => c - 1)}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </button>
          )}
          {hasNext && (
            <button type="button" onClick={() => setCurrent(c => c + 1)}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </button>
          )}
          {/* Counter + delete */}
          <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
            <span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
              {current + 1} / {photos.length}
            </span>
            <button type="button" onClick={() => remove(current)}
              style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto' }}>
          {photos.map((url, i) => (
            <img key={i} src={url} alt={`Miniatura ${i + 1}`}
              onClick={() => setCurrent(i)}
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: i === current ? '2px solid #2563eb' : '2px solid transparent', flexShrink: 0 }}
            />
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ ...btnSecondary, fontSize: '13px', padding: '8px 14px', width: '100%', justifyContent: 'center', opacity: uploading ? 0.6 : 1 }}>
            {uploading ? 'Subiendo...' : photos.length === 0 ? '📷 Subir fotos' : '📷 Agregar foto'}
          </button>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            JPG, PNG hasta 5MB · Máx {maxPhotos} fotos
          </p>
        </>
      )}
    </div>
  )
}
