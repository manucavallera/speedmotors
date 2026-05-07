export interface PdfSettings {
  businessName: string
  tagline: string
  address: string
  phone: string
  email: string
  cuit: string
  condicionIva: string
}

const defaults: PdfSettings = {
  businessName: 'Speed Motors',
  tagline: 'Motos · Lanchas · Accesorios · Repuestos',
  address: '', phone: '', email: '', cuit: '',
  condicionIva: 'Responsable Inscripto',
}

export function getSettings(): PdfSettings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem('speedmotors_settings') || '{}') }
  } catch {
    return { ...defaults }
  }
}
