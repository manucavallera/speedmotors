import { type HelpSection } from '../components/ui/HelpModal'

// Guías de uso por sección (texto para el usuario final)

export const GUARDERIA_HELP: HelpSection[] = [
  {
    h: '¿Qué es esta sección?',
    items: [
      'Es el mapa de lugares de la guardería náutica. Cada casillero es un lugar físico donde se guarda una embarcación.',
      'Verde = libre, Azul = ocupado y al día, Rojo = ocupado con deuda.',
    ],
  },
  {
    h: 'Configurar los lugares (una vez)',
    items: [
      'Tocá "Configurar lugares" y cargá los códigos (ej A1, A2, B1...). Esto arma el mapa.',
      'En "Servicios" cargás los servicios anexos que cobrás (lavado, puesta en marcha, seguro, etc.) con su precio.',
    ],
  },
  {
    h: 'Guardar una embarcación',
    items: [
      'Tocá "+ Guardar embarcación" (o un lugar libre en el mapa).',
      'Elegí el cliente (o crealo ahí mismo), describí la embarcación y poné la tarifa mensual.',
      'El lugar queda ocupado a nombre de ese cliente.',
    ],
  },
  {
    h: 'Cobrar y deudas',
    items: [
      'Seleccioná un lugar ocupado y tocá "Cobrar". Sumás la cuna + los servicios que quieras.',
      'Si marcás "cobrado ahora", la plata entra a la caja abierta. Si no, queda como deuda.',
      'El panel "Deudores" (abajo a la derecha) lista a quién le falta pagar, ordenado por monto.',
      'Desde Deudores podés tocar "Cobrar" para saldar, o el ícono 💬 para reclamar por WhatsApp.',
    ],
  },
  {
    h: 'Otras cosas',
    items: [
      'El buscador de arriba encuentra una embarcación, cliente o lugar y lo marca en el mapa.',
      '"Cobrado en el mes" muestra cuánto facturó la guardería este mes.',
      'Para liberar un lugar, seleccionalo y tocá "Retirar".',
    ],
  },
]

export const TURNERA_HELP: HelpSection[] = [
  {
    h: '¿Qué es esta sección?',
    items: [
      'Es la agenda de salidas al agua (botaduras). Sirve para ordenar quién mete la lancha a la rampa y a qué hora, para que no se encimen dos.',
      'Las lanchas son las que están guardadas en la Guardería.',
    ],
  },
  {
    h: 'El calendario',
    items: [
      'A la izquierda elegís el día. Los días con salidas aparecen marcados en azul con un número (cuántas salidas tienen).',
      'Con las flechas ‹ › cambiás de mes.',
    ],
  },
  {
    h: 'Configurar los turnos',
    items: [
      'Tocá "⚙ Configurar turnos" y elegí cada cuántos minutos es un turno (5, 15, 30, 60...) y de qué hora a qué hora.',
      'La grilla de casilleros se arma sola con esa configuración y vale para todos los días.',
    ],
  },
  {
    h: 'Reservar una salida',
    items: [
      'En la grilla, tocá un casillero que diga "Libre". Se abre el formulario con ese horario ya puesto.',
      'Elegí la lancha (sale el cliente solo), un servicio opcional y el precio. Listo: el casillero queda OCUPADO.',
      'Si necesitás un horario que no entra en la grilla, usá "+ Salida al agua" y cargalo a mano.',
    ],
  },
  {
    h: 'Cobrar y manejar las salidas',
    items: [
      'Abajo de la grilla está la lista de salidas del día.',
      'Tocá "Cobrar" en una salida y la plata entra a la caja abierta; queda marcada como completada (verde).',
      'También podés cancelar o eliminar una salida desde esa lista.',
    ],
  },
]

export const PROVEEDURIA_HELP: HelpSection[] = [
  {
    h: '¿Qué es esta sección?',
    items: [
      'Es el punto de venta (POS) de la proveeduría: comida, bebidas y artículos.',
      'Tiene su propio stock y sus propios productos, separados de la concesionaria.',
    ],
  },
  {
    h: 'Cargar productos (una vez)',
    items: [
      'Tocá "Productos" para crear/editar artículos: nombre, precio de venta, stock y stock mínimo.',
      'El stock mínimo sirve para que te avise cuando algo está por agotarse.',
    ],
  },
  {
    h: 'Vender',
    items: [
      'Buscá el producto y tocalo para agregarlo al carrito (derecha). Ajustá la cantidad con + / −.',
      'Tocá cobrar: descuenta el stock y la venta entra a la caja abierta.',
    ],
  },
  {
    h: 'Información de abajo',
    items: [
      '"Más vendidos": los productos que más salen.',
      '"Bajo stock": lo que está por agotarse; tocá un ítem para ir a gestionarlo y reponer.',
      '"Últimas ventas": el historial reciente con fecha, hora y monto.',
      'Arriba ves ventas de hoy, total del día y ticket promedio.',
    ],
  },
]
