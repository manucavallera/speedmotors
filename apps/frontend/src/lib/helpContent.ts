import { type HelpSection } from '../components/ui/HelpModal'

// Guías de uso por sección (texto para el usuario final)

export const GUARDERIA_HELP: HelpSection[] = [
  {
    group: 'Primeros pasos',
    h: 'Prepará la guardería (una sola vez y en este orden)',
    items: [
      '1) "Categorías": creá las escalas de lancha y cargá el precio de cuna mensual y de salida al agua.',
      '2) "Servicios": cargá lo que cobrás aparte, como seguro, batería, combustible, lavado o parrilla.',
      '3) "Configurar lugares": activá las líneas del galpón que estén operativas.',
      '4) "Clientes": cargá los dueños y sus teléfonos; el teléfono les permite reservar turnos desde el celular.',
      '5) Usá "+ Guardar embarcación" para asignar cada lancha a su cuna.',
    ],
  },
  {
    group: 'Primeros pasos',
    h: 'Entendé los dos cobros',
    items: [
      'CUNA MENSUAL: se cobra desde Guardería por tener la lancha guardada.',
      'SALIDA AL AGUA: se cobra desde Turnera cada vez que el cliente usa la lancha.',
      'Un cliente que deja la lancha todo el mes y no navega nunca, paga solo la cuna. Si sale cuatro domingos, paga la cuna + cuatro salidas.',
    ],
  },
  {
    group: 'Primeros pasos',
    h: 'Configurá categorías y servicios',
    items: [
      'Las categorías completan automáticamente los precios de cuna mensual y salida al agua. Podés cambiar un precio puntual sin modificar la tarifa general.',
      '"Se adhiere a la lancha" = se cobra todos los meses junto con la cuna. Ejemplo: un seguro.',
      '"Se ofrece en el turno" = aparece al reservar una salida y se cobra esa vez. Ejemplo: la batería o el combustible.',
      'Un servicio puede estar disponible en ambos lugares, pero debe tener al menos una opción marcada.',
    ],
  },
  {
    group: 'Uso diario',
    h: 'Leé el mapa y guardá embarcaciones',
    items: [
      'Cada casillero es una cuna. Verde = libre, azul = ocupada y al día, rojo = con deuda y gris = línea en obra.',
      'Tocá una cuna libre o "+ Guardar embarcación", elegí el cliente, la categoría, los servicios fijos y la ubicación.',
      'Si queda sobre trailer, guardala sin cuna; aparecerá debajo del mapa hasta que le asignes una.',
    ],
  },
  {
    group: 'Uso diario',
    h: 'Editá, mové o retirala',
    items: [
      'Seleccioná la cuna para editar los datos de la embarcación sin retirarla y volverla a cargar.',
      '"Mover de cuna" muestra únicamente lugares libres y operativos.',
      '"Retirar embarcación" libera la cuna cuando la lancha deja la guardería.',
    ],
  },
  {
    group: 'Uso diario',
    h: 'Cobrá el mes y controlá las deudas',
    items: [
      'Seleccioná una cuna y tocá "Cobrar", o usá "Cobrar el mes" para generar las mensualidades.',
      'Si marcás "cobrado ahora", el pago entra en la Caja Marina abierta. Si está cerrada, queda visible como pendiente y se incorpora automáticamente al abrirla.',
      'Si no está cobrado, queda como deuda. El panel "Deudores" permite saldarla o reclamar por WhatsApp.',
    ],
  },
  {
    group: 'Uso diario',
    h: 'Buscá clientes y comunicate',
    items: [
      '"Clientes" administra la cartera propia de la guardería. Cargá siempre el teléfono para habilitar la reserva desde el celular.',
      'El buscador encuentra una embarcación, cliente o cuna y la marca en el mapa.',
      '"Difusión" reúne los teléfonos cargados para enviar precios o avisos por WhatsApp.',
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
    h: 'Configurar la grilla (una sola vez)',
    items: [
      'Tocá "⚙ Configurar turnos" y elegí cada cuántos minutos es un turno, y de qué hora a qué hora abre el día.',
      'Arranca en 10 minutos: uno a las 7:00, otro a las 7:10, otro a las 7:20. Si te queda corto, bajalo a 5.',
      'Cargá también el teléfono de WhatsApp de la marina, solo números y con el código de país. Ejemplo: 5493434111222 (54, 9, código de área sin el 0, y el número sin el 15).',
      'Ese teléfono es al que le llega el aviso cuando un cliente reserva desde el celular. Si no lo cargás, el cliente reserva igual pero no te avisa nadie.',
      'La configuración es una sola para todos: la misma grilla la ven vos, el empleado y el cliente.',
    ],
  },
  {
    h: 'Reservar una salida',
    items: [
      'En la grilla, tocá un casillero que diga "Libre". Se abre el formulario con ese horario ya puesto.',
      'Elegí la lancha y el cliente sale solo.',
      'El precio de la salida al agua se completa solo con el de la categoría de esa lancha. Podés cambiarlo para ese turno si hace falta.',
      'Tildá los servicios que pide: batería, combustible, parrilla, los que sean. Podés marcar varios y ajustar el precio de cada uno.',
      'Abajo ves el total del turno. Ese es el importe que se cobra.',
      'Si necesitás un horario que no entra en la grilla, usá "+ Salida al agua" y cargalo a mano.',
      'La rampa es una sola: el sistema no te deja pisar dos salidas en el mismo horario.',
    ],
  },
  {
    h: 'Cuando el cliente cambia de idea',
    items: [
      'CORRER EL TURNO: si te pide otro horario, tocá "Correr" en esa salida y elegí la hora nueva. Mantiene la misma duración y no hace falta cargar todo de nuevo.',
      'CAMBIAR LO QUE PIDIÓ: tocá "Editar" y agregás o sacás servicios. El total se recalcula solo.',
      'Los dos botones andan mientras la salida esté reservada y sin cobrar. Una vez cobrada queda cerrada.',
      'Si al final no viene, cancelá la salida: libera el horario para otro cliente.',
    ],
  },
  {
    h: 'El domingo a la mañana',
    items: [
      'Tocá "🖨 Imprimir lista" y llevate la hoja del día impresa: sale ordenada por hora, con lancha, cliente, servicios y total.',
      'Ese es el orden en que hay que ir bajando las lanchas. Las canceladas no aparecen.',
      'Con la hoja en la mano no hace falta estar mirando la pantalla mientras trabajás en el galpón.',
      'A medida que cobrás, tocá "Cobrar" en cada salida: queda en verde y el pago entra en la Caja Marina. Si la caja está cerrada, queda pendiente hasta la próxima apertura.',
    ],
  },
  {
    h: 'Que el cliente reserve solo (lo que más tiempo ahorra)',
    items: [
      'Hay una página aparte donde el cliente reserva su turno desde el celular, sin llamarte y sin usuario ni contraseña.',
      'Es la dirección de la app con /turnos al final. Pasásela por WhatsApp a los clientes de guardería una vez y la guardan.',
      'El cliente pone su teléfono, ve sus lanchas, elige un horario libre y confirma. Al terminar le aparece un botón verde que te manda el aviso por WhatsApp.',
      'Solo entran los que tienen lancha en la guardería y el teléfono cargado. Por eso importa cargar bien el teléfono en la ficha del cliente.',
      'No ve los nombres de los demás: en la grilla solo distingue qué horarios están ocupados.',
      'No puede reservar a nombre de una lancha que no es de él, ni pisar un horario ya tomado.',
      'Las reservas que hacen ellos te caen en la misma grilla que las que cargás vos. Las manejás igual: correr, editar, cobrar.',
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
      'Tocá cobrar: descuenta el stock y registra la venta en la Caja Marina.',
      'Si la caja está cerrada, el cobro queda visible como pendiente y se incorpora automáticamente en la próxima apertura.',
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
