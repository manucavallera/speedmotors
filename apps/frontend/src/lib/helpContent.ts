import { type HelpSection } from '../components/ui/HelpModal'

// Guías de uso por sección (texto para el usuario final)

export const GUARDERIA_HELP: HelpSection[] = [
  {
    h: 'Primeros pasos (hacelo una sola vez, en este orden)',
    items: [
      '1) "Categorías": creá las escalas de lancha y ponele los dos precios a cada una. Sin esto, después tenés que tipear el precio a mano en cada lancha y en cada turno.',
      '2) "Servicios": cargá todo lo que cobrás aparte (seguro, batería, combustible, lavado, parrilla) con su precio.',
      '3) "Configurar lugares": activá las líneas del galpón que estén operativas.',
      '4) "Clientes": cargá los dueños de las lanchas, con el teléfono. El teléfono es importante: es lo que usan para reservar turnos ellos mismos.',
      '5) Recién ahí empezá a guardar lanchas en las cunas.',
      'Si algo te quedó mal, todo se edita después. Nada queda clavado.',
    ],
  },
  {
    h: 'Los dos cobros (la clave de todo)',
    items: [
      'La guardería cobra de dos maneras distintas, y conviene tenerlas claras porque todo el sistema se apoya en eso.',
      'LA CUNA: se cobra una vez por mes, por tener la lancha guardada. Es como el alquiler de una cochera. Se cobra desde acá, con el botón "Cobrar".',
      'LA SALIDA AL AGUA: se cobra cada vez que el cliente saca la lancha. Es el turno. Se cobra desde la Turnera.',
      'Un cliente que deja la lancha todo el mes y no navega nunca, paga solo la cuna. Si sale cuatro domingos, paga la cuna + cuatro salidas.',
    ],
  },
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
      'Cada categoría lleva DOS precios: la "Cuna mensual" (lo que paga por mes) y la "Salida al agua" (lo que paga por cada turno).',
      'Son la lista de precios, no un cobro. Cuando guardás una lancha o agendás un turno, el precio se completa solo con el de su categoría.',
      'Si con un cliente arreglaste distinto, pisás el precio en esa lancha o en ese turno y la lista de precios queda igual para el resto.',
      'Cambiás un precio de categoría y se actualiza en todas las lanchas de esa categoría.',
    ],
  },
  {
    h: 'Servicios: dónde se cobra cada uno',
    items: [
      'En "Servicios" cargás todo lo que le cobrás al cliente además de la cuna: seguro, combustible, alquiler de batería, parrilla, lavado, puesta en marcha.',
      'A cada servicio le ponés el precio y le marcás DÓNDE se cobra, con dos tildes:',
      '"Se adhiere a la lancha" = se cobra todos los meses junto con la cuna. Ejemplo: un seguro.',
      '"Se ofrece en el turno" = aparece al reservar una salida y se cobra esa vez. Ejemplo: la batería o el combustible.',
      'Podés marcar las dos si el servicio va en los dos lados. Al menos una tiene que estar marcada, si no el servicio no le aparece a nadie.',
      'Esto evita el error de cobrarle el seguro dos veces: una con la cuna del mes y otra cuando reserva el turno.',
      'En la lista de servicios ves la etiqueta "mensual" o "por turno" de cada uno, para chequear de un vistazo.',
    ],
  },
  {
    h: 'Guardar una lancha',
    items: [
      'Tocá "+ Guardar embarcación" (o una cuna libre en el mapa).',
      'Elegí el cliente (o crealo ahí mismo), describí la lancha, y cargá los HP y el largo.',
      'Elegí la categoría: la cuna mensual se completa sola con el precio de esa categoría.',
      'Tildá los servicios fijos que lleve (el seguro, por ejemplo). Esos se le van a sumar todos los meses al cobrar.',
      'Elegí la cuna. Si la lancha queda suelta sobre trailer, dejá la cuna sin asignar.',
    ],
  },
  {
    h: 'Corregir datos de una lancha ya guardada',
    items: [
      'Seleccioná la cuna y tocá "Editar datos". Cambiás categoría, HP, largo, descripción o la tarifa mensual.',
      'No hace falta retirar la lancha y volver a cargarla para corregir un dato.',
      'Si le cambiás la categoría, acordate de revisar la tarifa: no se pisa sola para no romper un arreglo especial que hayas hecho.',
    ],
  },
  {
    h: 'Clientes de la guardería',
    items: [
      'El botón "Clientes" abre la cartera de clientes de la guardería, aparte de los de la concesionaria.',
      'Desde ahí los buscás, los creás y les editás los datos.',
      'Cargales SIEMPRE el teléfono: es lo que les permite reservar el turno solos desde el celular, sin llamarte.',
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
      'A medida que cobrás, tocá "Cobrar" en cada salida: la plata entra a la caja abierta y queda en verde.',
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
