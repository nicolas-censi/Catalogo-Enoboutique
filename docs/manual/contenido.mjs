// Contenido de los manuales. Cada sección dice para quién es: "v" (vendedores), "e"
// (encargado) o los dos. Los números de los pasos coinciden con los de las capturas
// (docs/manual/capturas.spec.ts). `img` es el nombre de la captura (sin .jpg).

export const MANUALES = {
  v: {
    archivo: "manual-vendedores",
    titulo: "Manual del panel para vendedores",
    bajada:
      "Cómo cargar y mantener al día los productos, las secciones y las sugerencias de la IA de la carta de Lehonor Enoboutique.",
  },
  e: {
    archivo: "manual-encargado",
    titulo: "Manual del panel para el encargado",
    bajada:
      "Todo lo que hace el vendedor, más la importación desde Tango, las promociones, la marca, la IA, el personal y la tarjeta QR.",
  },
};

/** @typedef {{ para: ("v"|"e")[], id: string, titulo: string, intro?: string, bloques: Bloque[] }} Seccion */
/** @typedef {{ subtitulo?: string, texto?: string, pasos?: string[], img?: string, imgV?: string, imgE?: string, celular?: boolean, nota?: string, consejo?: string }} Bloque */

/** @type {Seccion[]} */
export const SECCIONES = [
  {
    para: ["v", "e"],
    id: "que-es",
    titulo: "Qué es y dónde se entra",
    intro:
      "La carta es la página que ven los clientes al escanear el QR de la mesa (cava.lehonor.com). El panel es la parte privada desde donde el personal la mantiene: productos, precios, disponibilidad, fotos y secciones. Todo lo que cambiás en el panel se ve en la carta apenas lo guardás.",
    bloques: [
      {
        subtitulo: "Entrar al panel",
        texto: "Abrí cava.lehonor.com/admin en la computadora o en el celular.",
        pasos: [
          "Escribí tu usuario (te lo da el encargado).",
          "Escribí tu contraseña.",
          "Tocá Ingresar.",
        ],
        imgV: "v-ingresar",
        imgE: "e-ingresar",
        nota: "¿Te olvidaste la contraseña? El encargado te la cambia desde Ajustes → Personal.",
      },
      {
        subtitulo: "El menú",
        texto: "En la computadora el menú está a la izquierda; en el celular, en una barra fija abajo.",
        pasos: [
          "Productos: la lista de todo lo que hay en la carta. Es donde vas a trabajar casi siempre.",
          "Secciones: las partes de la carta (Tintos, Blancos, Espumantes…), su orden y sus destacados.",
          "Para revisar: las sugerencias de la IA que esperan tu aprobación. El número indica cuántas hay.",
          "@v Cuenta: tu usuario y el botón para salir.@e Ajustes: lo que se usa de vez en cuando (importar, promociones, marca, IA, personal y tarjeta QR).",
          "Ver la carta: abre la carta tal como la ve el cliente, en otra pestaña.",
          "Salir: cierra tu sesión. Usalo siempre si la computadora es compartida.",
        ],
        imgV: "v-menu",
        imgE: "e-menu",
      },
      {
        subtitulo: "En el celular",
        texto: "El panel funciona igual en el celular. Las opciones del menú quedan en la barra de abajo, siempre a mano.",
        pasos: ["Productos.", "Secciones.", "Revisar (Para revisar).", "@v Cuenta (para salir).@e Ajustes (a los vendedores les aparece Cuenta, como en la imagen)."],
        img: "celular-panel",
        celular: true,
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "productos",
    titulo: "Productos",
    intro:
      "Cada producto es una etiqueta (por ejemplo, Rutini Malbec) con una o varias añadas. Cada añada tiene su código de Tango, su precio y si está disponible o no.",
    bloques: [
      {
        subtitulo: "La lista de productos",
        pasos: [
          "Buscador: escribí parte del nombre, la bodega, el código de Tango o el código de barras.",
          "Filtros rápidos: Sin sección, Sin foto, A revisar, Ocultos y Sin stock. Sirven para encontrar lo que falta completar.",
          "Sección: muestra solo los productos de una sección.",
          "Nuevo producto: para cargar uno a mano.",
          "Elegir varios: para mover o pedir sugerencias de varios productos juntos.",
          "Tocá un producto para abrir su ficha.",
        ],
        img: "productos-lista",
        nota: "Las etiquetas a la derecha te avisan qué le falta a cada producto: Sin foto, A revisar (añadas sin año definido) o Sugerencia para revisar.",
      },
      {
        subtitulo: "Buscar un producto",
        texto: "La lista se filtra mientras escribís. Por ejemplo, con «malbec» aparecen todos los Malbec.",
        pasos: ["Escribí en el buscador. Para volver a ver todo, borrá lo escrito."],
        img: "productos-buscar",
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "ficha",
    titulo: "La ficha de un producto",
    intro: "La ficha tiene tres pestañas: Datos, Añadas y precios, y Códigos de barras.",
    bloques: [
      {
        subtitulo: "Datos y foto",
        pasos: [
          "Visible en la carta: apagalo para esconder el producto sin borrarlo.",
          "Datos: tipo, nombre, bodega, varietal, sección y descripción.",
          "Añadas y precios: cada añada con su precio y disponibilidad.",
          "Códigos de barras: los códigos que sirven para escanear la botella.",
          "Descripción: el texto que ve el cliente en la carta.",
          "Guardar: guarda los cambios de esta pestaña. Hasta que no lo tocás, no se guarda nada.",
          "Foto: Subir foto o Reemplazar foto (JPG, PNG, WebP o HEIC, hasta 10 MB; se achica sola). Quitar foto la saca.",
          "Más acciones (···): para borrar el producto.",
        ],
        img: "ficha-datos",
        consejo: "Si un producto queda sin sección, no aparece en la carta. Revisá el filtro «Sin sección» de vez en cuando.",
      },
      {
        subtitulo: "Borrar un producto",
        pasos: ["En la ficha, tocá ··· y después Borrar producto. Te pide confirmación: se borra con todas sus añadas y no se puede deshacer."],
        img: "ficha-borrar",
        nota: "Si solo querés que no se vea por un tiempo, mejor apagá «Visible en la carta».",
      },
      {
        subtitulo: "Añadas, precios y disponibilidad",
        pasos: [
          "Disponible / Sin stock: tocalo para cambiarlo. Las añadas sin stock no se ven en la carta; si ninguna tiene stock, se esconde el vino entero.",
          "··· de cada añada: para editarla o borrarla.",
          "Agregar añada: completá tipo de añada, año, código de Tango, precio y tocá Agregar.",
        ],
        img: "ficha-anadas",
        nota: "Si dejás el precio vacío, la carta muestra «Consultar precio». El tipo «Sin año (a revisar)» marca las añadas que la importación no pudo identificar: corregí el año cuando lo sepas.",
      },
      {
        subtitulo: "Cambiar el precio o el año de una añada",
        pasos: ["Tocá ··· en la añada y elegí Editar (o Borrar para sacarla).", "Cambiá el precio (o el año) y tocá Guardar."],
        img: "anada-menu",
      },
      {
        img: "anada-editar",
        pasos: ["Precio de la añada.", "Guardar."],
        nota: "@e Ojo: cuando importás el reporte de Tango, el precio de Tango reemplaza al que se cargó a mano.@v Ojo: cuando el encargado importa el reporte de Tango, el precio de Tango reemplaza al que se cargó a mano.",
      },
      {
        subtitulo: "Códigos de barras",
        texto: "El código de barras se asocia al vino (no a una añada). Al escanearlo, el cliente ve el vino con todas sus añadas disponibles.",
        pasos: [
          "Escribí el número del código de barras…",
          "…y tocá Agregar. Para sacar uno, tocá Quitar al lado del código.",
          "Escanear con la cámara: en el celular es lo más rápido. Apuntás a la botella y el código se carga solo.",
        ],
        img: "ficha-codigos",
      },
      {
        subtitulo: "Escanear el código con la cámara",
        texto:
          "Apuntá la cámara al código de barras de la botella, dentro del recuadro. Cuando lo lee, el celular vibra, la cámara se cierra y aparece «Se agregó el código …». Si la botella tiene otro código, tocá Escanear otro.",
        pasos: ["Cerrar: apaga la cámara sin cargar nada."],
        img: "escanear-camara",
        celular: true,
        nota: "Si el código ya es de otro producto, no se agrega y te dice de cuál. La primera vez, el celular te pide permiso para usar la cámara: tocá Permitir. Si lo rechazaste, habilitalo desde el candado al lado de la dirección del navegador.",
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "recorrer-cava",
    titulo: "Cargar códigos recorriendo la cava",
    intro:
      "Para cargar códigos botella por botella, escaneá desde la lista de Productos: si el código ya está cargado, te lleva a su producto; si no, te ayuda a asignárselo.",
    bloques: [
      {
        subtitulo: "Escanear desde la lista",
        pasos: ["Tocá el botón de escanear del buscador y apuntá a la botella. Si el código ya está cargado, se abre la ficha de ese producto."],
        img: "escanear-lista",
        celular: true,
      },
      {
        subtitulo: "Si el código no es de ningún producto",
        pasos: [
          "El panel avisa qué código leyó y que ningún producto lo tiene.",
          "Buscá el vino por nombre.",
          "Tocá el producto para abrir su ficha.",
        ],
        img: "escanear-sin-producto",
        celular: true,
      },
      {
        subtitulo: "Asignarle el código con un toque",
        pasos: ["Agregar 779…: carga el código que escaneaste en este producto."],
        img: "escanear-agregar",
        celular: true,
        consejo: "Antes de tocar Agregar, fijate que sea el vino correcto (y la presentación: 750 cc, magnum…).",
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "nuevo",
    titulo: "Cargar un producto nuevo",
    intro: "Lo habitual es que los productos lleguen desde Tango. Si necesitás cargar uno a mano:",
    bloques: [
      {
        pasos: [
          "Elegí el tipo: Vino, Destilado, Aceite o Almacén. Solo los vinos tienen añadas.",
          "Escribí el nombre como se tiene que ver en la carta (por ejemplo, «Catena Zapata Malbec»).",
          "Elegí la sección. Sin sección no aparece en la carta.",
          "Tocá el botón para crearlo. Después, en su ficha, agregá las añadas, la foto y el código de barras.",
        ],
        img: "nuevo-producto",
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "varios",
    titulo: "Trabajar con varios productos a la vez",
    bloques: [
      {
        pasos: [
          "En Productos, tocá Elegir varios y tildá los productos. También podés elegir todos los del filtro o de la página.",
          "Mover: los pasa a otra sección.",
          "Sugerir con IA: pide descripción y foto para todos los elegidos.",
        ],
        img: "elegir-varios",
        nota: "Cuando termines, tocá Listo para salir del modo «Elegir varios».",
      },
      {
        subtitulo: "Mover a otra sección",
        pasos: ["Elegí la sección de destino.", "Tocá Mover."],
        img: "mover-dialogo",
      },
      {
        subtitulo: "Pedir sugerencias para varios",
        pasos: [
          "Antes de pedir, el panel te muestra cuántas sugerencias vas a pedir y el costo estimado.",
          "Tocá Sí, pedir para confirmar (o Cancelar). Se pueden pedir hasta 1.000 por vez y se procesan hasta 400 por día.",
        ],
        img: "sugerir-varios",
        nota: "Por defecto se piden solo para los productos sin descripción o sin foto. Las sugerencias van llegando a Para revisar mientras el panel esté abierto.",
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "ia",
    titulo: "Sugerencias de la IA (descripción y foto)",
    intro:
      "La IA busca en internet la descripción y la foto oficial de un producto (en la página de la bodega o del distribuidor). Nada de lo que sugiere se ve en la carta hasta que alguien del personal lo aprueba.",
    bloques: [
      {
        subtitulo: "Pedir una sugerencia desde la ficha",
        pasos: ["Abrí la ficha del producto y tocá Sugerir con IA. Podés seguir trabajando: el panel te avisa cuando está lista."],
        img: "ficha-sugerir",
        nota: "@v Si dice «Las sugerencias por IA están apagadas», pedile al encargado que las prenda.@e Si dice «Las sugerencias por IA están apagadas», prendelas desde Ajustes → IA.",
      },
      {
        subtitulo: "Cuando llega una sugerencia",
        texto: "La ficha del producto muestra un aviso y el menú suma uno en Para revisar.",
        pasos: ["Tocá Revisar para verla."],
        img: "ficha-aviso-ia",
      },
      {
        subtitulo: "Revisar, corregir y aprobar",
        texto: "En Para revisar está, para cada producto, lo actual al lado de lo sugerido.",
        pasos: [
          "Descripción sugerida: leela y corregila si hace falta (es un campo editable).",
          "De dónde salió: las páginas que usó la IA. Abrilas si tenés dudas.",
          "Usar la descripción: destildalo si no querés usarla.",
          "Usar la foto: destildalo si la foto no es la correcta (por ejemplo, otra añada u otro vino).",
          "Aprobar: lo elegido pasa a la carta en el momento.",
          "Descartar: la sugerencia se borra y no cambia nada.",
        ],
        img: "para-revisar",
        consejo: "Revisá siempre que la foto sea de ese vino y que el texto no tenga datos inventados. La IA ayuda, pero la última palabra es tuya.",
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "secciones",
    titulo: "Secciones",
    intro: "Las secciones son las partes de la carta. Se muestran en el mismo orden que en esta lista.",
    bloques: [
      {
        pasos: [
          "Manija: arrastrala para cambiar el orden de la carta.",
          "Visible / Oculta: tocalo para mostrar u ocultar la sección entera.",
          "··· : para renombrar o borrar la sección.",
          "Nombre de la sección nueva.",
          "Crear sección: la nueva queda al final.",
          "Tocá el nombre para ver sus subsecciones y destacados.",
        ],
        img: "secciones",
      },
      {
        subtitulo: "Renombrar o borrar",
        pasos: ["Renombrar.", "Borrar: solo se puede si la sección está vacía (sin productos ni subsecciones). Si no, ocultala."],
        img: "seccion-menu",
      },
      {
        subtitulo: "Subsecciones y destacados",
        texto:
          "Las subsecciones dividen una sección (por ejemplo, Cava → Joyitas y Experiencias). Los destacados aparecen primeros en la sección, en el orden que elijas; el resto se ordena solo, por bodega y del más caro al más barato.",
        pasos: [
          "Nombre de la subsección nueva.",
          "Crear subsección. Al crear la primera, todos los productos de la sección pasan a ella; después los podés mover.",
          "Para destacar, buscá un producto de la sección.",
          "Tocá Agregar al lado del producto. Los destacados se ordenan arrastrando y se sacan con Quitar.",
        ],
        img: "seccion-detalle",
      },
    ],
  },
  {
    para: ["v"],
    id: "cuenta",
    titulo: "Tu cuenta",
    bloques: [
      {
        texto: "En la computadora, tu usuario y el botón Salir están abajo del menú. En el celular, entrá a Cuenta (en la barra de abajo).",
        pasos: ["Salir: cerrá la sesión al terminar, sobre todo si la computadora o el celular son compartidos."],
        img: "v-ajustes",
        nota: "Si necesitás cambiar tu contraseña o el acceso de otra persona, pedíselo al encargado.",
      },
    ],
  },
  {
    para: ["e"],
    id: "ajustes",
    titulo: "Ajustes",
    intro: "Ajustes reúne lo que se usa de vez en cuando. Solo lo ve el encargado.",
    bloques: [{ img: "e-ajustes" }],
  },
  {
    para: ["e"],
    id: "importar",
    titulo: "Importar precios y productos desde Tango",
    intro:
      "Se sube el reporte «Precios por artículo» de Tango (Excel o CSV). Antes de aplicar, el panel muestra qué va a cambiar; recién al tocar Importar se aplica todo junto.",
    bloques: [
      {
        subtitulo: "Subir el reporte",
        pasos: [
          "Elegir archivo: el reporte exportado de Tango.",
          "Ver qué cambia: lee el archivo y arma el resumen. Todavía no cambia nada.",
          "Diccionario de abreviaturas: cómo se escriben completos los nombres (MAL → Malbec).",
          "Bodegas de Tango: el nombre de cada bodega según su código.",
        ],
        img: "importar",
      },
      {
        subtitulo: "Revisar el resumen e importar",
        pasos: [
          "Resumen: productos y añadas nuevas, precios que cambian y lo que no se importa (carnes, comidas, gift cards y otros).",
          "Precios que cambian: el precio anterior y el nuevo de cada código.",
          "Productos nuevos: revisá la sección de cada uno. Podés cambiarla de a uno o tildar varios y ponerlos juntos en una sección.",
          "Importar: aplica todo. Si algo no te cierra, tocá Cancelar y no cambia nada.",
        ],
        img: "importar-resumen",
        nota: "Los productos nuevos entran ocultos (y las añadas nuevas de vinos que ya existen, sin stock) para que los revises antes de publicarlos. Al terminar, el panel te deja enlaces a «Productos sin sección», «Productos ocultos» y «Añadas sin especificar». Los precios de Tango reemplazan a los cargados a mano.",
      },
      {
        subtitulo: "Diccionario de abreviaturas",
        texto: "Tango abrevia los nombres (MAL, CAB SAUV, RVA). La importación los escribe completos con este diccionario. Los cambios valen para las próximas importaciones.",
        pasos: ["Abreviatura, como figura en Tango.", "Qué significa.", "Guardar abreviatura."],
        img: "abreviaturas",
      },
      {
        subtitulo: "Bodegas de Tango",
        texto: "En Tango, las letras 3 a 5 del código de cada vino indican la bodega (VIrut… es Rutini). Revisá que los nombres estén bien: se ven en la carta.",
        pasos: ["Corregí el nombre y tocá Guardar."],
        img: "bodegas",
      },
    ],
  },
  {
    para: ["e"],
    id: "promociones",
    titulo: "Promociones",
    intro: "Las promociones son imágenes que se ven al final del inicio de la carta, en un carrusel. Al tocarlas, el cliente las ve en grande.",
    bloques: [
      {
        pasos: [
          "Subir imágenes: JPG, PNG o WebP, hasta 5 MB cada una (se achican solas). Podés subir varias juntas.",
          "Manija: arrastrala para cambiar el orden.",
          "Visible / Oculta: para sacarla de la carta sin borrarla.",
          "··· : para borrarla.",
        ],
        img: "promociones",
      },
    ],
  },
  {
    para: ["e"],
    id: "marca",
    titulo: "Marca: bienvenida y logo",
    bloques: [
      {
        pasos: [
          "Bienvenida: el texto debajo del logo en el inicio de la carta (hasta 200 caracteres). Si lo dejás vacío, no se muestra.",
          "Guardar bienvenida.",
          "Logo nuevo: PNG o WebP de hasta 2 MB, mejor con fondo transparente. Vas a ver una vista previa; tocá Usar este logo para aplicarlo.",
        ],
        img: "marca",
        nota: "El margen vacío alrededor del logo se recorta solo, para que se vea del tamaño correcto. «Volver al logo de la marca» deja el logo original.",
      },
    ],
  },
  {
    para: ["e"],
    id: "ia-ajuste",
    titulo: "IA: prender o apagar",
    intro: "Con la IA apagada no se hace ningún pedido, así que no hay gasto. Las sugerencias que ya llegaron se pueden seguir revisando.",
    bloques: [
      {
        pasos: ["Interruptor de las sugerencias por IA. El cambio vale para todo el personal."],
        img: "ia",
        nota: "El gasto estimado del mes se ve arriba de todo en Para revisar.",
      },
    ],
  },
  {
    para: ["e"],
    id: "personal",
    titulo: "Personal: quién entra al panel",
    intro: "Cada persona entra con su usuario y contraseña. Vos los creás y se los pasás.",
    bloques: [
      {
        pasos: [
          "Rol: Vendedor o Encargado. Se cambia en el momento.",
          "··· : para cambiarle la contraseña o darlo de baja.",
          "Usuario nuevo (sin espacios, por ejemplo «martin»).",
          "Contraseña inicial.",
          "Rol.",
          "Dar de alta. La persona ya puede entrar.",
        ],
        img: "personal",
        nota: "El vendedor maneja productos, secciones y sugerencias. El encargado, además, todo lo de Ajustes.",
      },
      {
        subtitulo: "Cambiar una contraseña o dar de baja",
        pasos: ["Cambiar contraseña: escribís la nueva y se la pasás a la persona.", "Dar de baja: la persona no puede entrar más. No podés darte de baja a vos mismo."],
        img: "personal-menu",
      },
    ],
  },
  {
    para: ["e"],
    id: "qr",
    titulo: "Tarjeta QR para las mesas",
    bloques: [
      {
        texto: "Tarjeta de 10 × 15 cm con el logo y el QR que abre la carta.",
        pasos: ["Imprimir: sale sola y del tamaño justo. En la ventana de impresión también la podés guardar como PDF para mandarla a una imprenta."],
        img: "qr",
      },
    ],
  },
  {
    para: ["v", "e"],
    id: "carta",
    titulo: "Cómo ve la carta el cliente",
    intro: "Así se ve en el celular lo que cargás en el panel. Conviene mirarlo después de cambios grandes (con Ver la carta, en el menú).",
    bloques: [
      {
        subtitulo: "Inicio",
        pasos: [
          "Buscador: por vino, bodega, varietal o código.",
          "Escanear: abre la cámara para leer el código de barras de una botella.",
          "Secciones de la carta, en el orden del panel. Las promociones aparecen al final.",
        ],
        img: "carta-inicio",
        celular: true,
      },
      { subtitulo: "Una sección", pasos: ["Cada vino con sus añadas y precios. Tocalo para ver el detalle."], img: "carta-seccion", celular: true },
      { subtitulo: "El detalle de un vino", texto: "Foto, descripción, y las añadas disponibles con su precio.", img: "carta-vino", celular: true },
      { subtitulo: "Buscar", texto: "Los resultados aparecen mientras el cliente escribe.", img: "carta-buscar", celular: true },
      {
        subtitulo: "Escanear",
        texto: "Con la cámara, el cliente apunta al código de barras y llega directo al vino. Si no puede usar la cámara, escribe el número.",
        pasos: ["Número del código de barras (cuando no se puede escanear)."],
        img: "carta-escanear",
        celular: true,
      },
    ],
  },
];
