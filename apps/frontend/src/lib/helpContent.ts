import { type HelpSection } from '../components/ui/HelpModal'

// Guías de uso por sección (texto para el usuario final)

export const GUARDERIA_HELP: HelpSection[] = [
  {
    h: '¿Qué es esta sección?',
    items: [
      'Es el mapa del galpón. Cada casillero es una cuna: el lugar donde se guarda la lancha de un cliente.',
      'Las lanchas son de los clientes. Vos les alquilás la cuna por mes, como una cochera, y les cobrás los servicios aparte.',
      'Verde = cuna libre. Azul = ocupada y al día. Rojo = ocupada con deuda. Gris = línea en obra.',
    ],
  },
  {
    h: 'Las líneas del galpón',
    items: [
      'El galpón tiene 4 líneas (A, B, C y D) con 48 cunas cada una. Se numeran A1 a A48, B1 a B48, y así.',
      'Hoy están operativas la A y la B. La C y la D aparecen como "EN OBRA" hasta que se haga el piso.',
      'Cada línea se pliega y despliega tocando su título. Las que están en obra arrancan cerradas.',
      'Cuando la C o la D estén listas, se activan desde "Configurar lugares".',
    ],
  },
  {
    h: 'Categorías y tarifas',
    items: [
      'En "Categorías" definís las escalas: por ejemplo de 2 a 35 HP una tarifa, de 40 a 90 HP otra, de 90 para arriba otra.',
      'También podés usar el largo de la lancha en metros para separar categorías.',
      'Al guardar una lancha, elegís su categoría y la tarifa mensual se completa sola. Podés cambiarla a mano si hay una excepción.',
      'Los precios los ponés vos y los cambiás cuando quieras.',
    ],
  },
  {
    h: 'Servicios',
    items: [
      'En "Servicios" cargás todo lo que le cobrás al cliente además de la cuna: bajada al agua, combustible, alquiler de batería, parrilla, asado, seguros.',
      'Le ponés precio a cada uno, agregás los que quieras y borrás el que no uses más.',
      'Los servicios se cobran de dos formas: junto con la cuna del mes, o cuando el cliente reserva la salida al agua en la Turnera.',
    ],
  },
  {
    h: 'Guardar una lancha',
    items: [
      'Tocá "+ Guardar embarcación" (o una cuna libre en el mapa).',
      'Elegí el cliente (o crealo ahí mismo), describí la lancha, y cargá los HP y el largo.',
      'Elegí la cuna. Si la lancha queda suelta sobre trailer, dejá la cuna sin asignar.',
    ],
  },
  {
    h: 'Mover de cuna y lanchas sobre trailer',
    items: [
      'Si entra una lancha nueva y hay que reubicar, seleccioná la cuna y tocá "Mover de cuna": elegís la nueva y listo.',
      'Solo aparecen las cunas libres de las líneas operativas.',
      'Las lanchas sueltas sobre trailer (sin cuna) se ven abajo del mapa, con su deuda. Desde ahí las cobrás o les das una cuna cuando se libere.',
    ],
  },
  {
    h: 'Cobrar y deudas',
    items: [
      'Seleccioná una cuna ocupada y tocá "Cobrar". Sumás la cuna del mes + los servicios que haya usado.',
      'Si marcás "cobrado ahora", la plata entra a la caja abierta. Si no, queda como deuda del cliente.',
      'El panel "Deudores" lista a quién le falta pagar, ordenado por monto.',
      'Desde Deudores podés cobrar para saldar, o reclamar por WhatsApp.',
    ],
  },
  {
    h: 'Difusión y otras cosas',
    items: [
      'En "Difusión" copiás los teléfonos de todos los clientes de guardería, para armar una lista de difusión de WhatsApp y mandarles precios o avisos.',
      'Te avisa cuántos clientes no tienen teléfono cargado: esos no van a recibir el mensaje.',
      'El buscador encuentra una lancha, cliente o cuna y la marca en el mapa.',
      'Para liberar una cuna, seleccionala y tocá "Retirar embarcación".',
    ],
  },
]

export const TURNERA_HELP: HelpSection[] = [
  {
    h: '¿Qué es esta sección?',
    items: [
      'Es la agenda de salidas al agua. El cliente avisa a qué hora quiere navegar y vos bajás su lancha para esa hora.',
      'Sirve para el domingo a la mañana: si todos llegan a las 7, se arma la cola. Con la agenda, cada uno tiene su horario y la lancha ya está en el agua cuando llega.',
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
    h: 'Configurar la grilla',
    items: [
      'Tocá "⚙ Configurar turnos" y elegí cada cuántos minutos es un turno, y de qué hora a qué hora abre el día.',
      'Arranca en 10 minutos: uno a las 7:00, otro a las 7:10, otro a las 7:20. Si te queda corto, bajalo a 5.',
      'La configuración es una sola para todos: la misma grilla la ven vos, el empleado y el cliente.',
    ],
  },
  {
    h: 'Reservar una salida',
    items: [
      'En la grilla, tocá un casillero que diga "Libre". Se abre el formulario con ese horario ya puesto.',
      'Elegí la lancha y el cliente sale solo.',
      'Tildá los servicios que pide: batería, combustible, parrilla, los que sean. Podés marcar varios y ajustar el precio de cada uno.',
      'Abajo ves el total del turno. Ese es el importe que se cobra.',
      'Si necesitás un horario que no entra en la grilla, usá "+ Salida al agua" y cargalo a mano.',
    ],
  },
  {
    h: 'Cobrar y manejar las salidas',
    items: [
      'Abajo de la grilla está la lista de salidas del día, ordenada por hora. Es el orden en que hay que bajar las lanchas.',
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
