// @file: clients.types.ts | Tipos y constantes del dominio clientes. Importar desde acá.
export interface ClientForm {
  name: string
  phone: string
  email: string
  dni: string
  cuit: string
  condicionIva: string
  address: string
  notes: string
}

export const emptyClientForm: ClientForm = {
  name: '', phone: '', email: '', dni: '', cuit: '',
  condicionIva: 'consumidor_final', address: '', notes: '',
}

export const condicionIvaOptions = [
  { value: 'consumidor_final', label: 'Consumidor Final' },
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'exento', label: 'Exento' },
]

export const condicionIvaLabel: Record<string, string> = {
  consumidor_final: 'Cons. Final',
  monotributista: 'Monotrib.',
  responsable_inscripto: 'Resp. Inscripto',
  exento: 'Exento',
}

export const condicionIvaColors: Record<string, { bg: string; color: string }> = {
  responsable_inscripto: { bg: '#eff6ff', color: '#2563eb' },
  monotributista: { bg: '#f5f3ff', color: '#7c3aed' },
  consumidor_final: { bg: '#f8fafc', color: '#64748b' },
  exento: { bg: '#f0fdf4', color: '#16a34a' },
}

export function clientInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
