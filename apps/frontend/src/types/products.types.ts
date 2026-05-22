// @file: products.types.ts | Tipos del dominio productos. Importar desde acá.
export interface ProductForm {
  code: string
  name: string
  brand: string
  costPrice: string
  sellPrice: string
  stock: string
  minStock: string
  unit: string
  photoUrl: string
  photos: string[]
  serialNumber: string
  barcode: string
  ingresoTipo: string
}

export const emptyProductForm: ProductForm = {
  code: '', name: '', brand: '', costPrice: '', sellPrice: '',
  stock: '', minStock: '1', unit: 'U', photoUrl: '', photos: [], serialNumber: '', barcode: '', ingresoTipo: '',
}
