# 004 – Panel de administración (backoffice)

**Estado:** Borrador

## Objetivo
Que el personal (encargado y vendedor) mantenga la carta sin tocar código ni la base de
datos: dar de alta y editar productos y añadas, marcar a mano qué hay en stock, subir
fotos, ocultar o mostrar productos y administrar secciones. Es la herramienta del día a
día: lo más frecuente (marcar sin stock, cambiar un precio) tiene que hacerse en
segundos. Se usa principalmente desde la **computadora** del local, y también tiene que
funcionar desde el celular.

## Historias de usuario
- Como **personal**, quiero entrar con mi email y contraseña, para que nadie de afuera
  pueda cambiar la carta.
- Como **personal**, quiero buscar un producto y marcar una añada como "Sin stock" con
  un toque, para que la carta deje de mostrarla.
- Como **personal**, quiero cambiar el precio de una añada, para corregirlo al momento.
- Como **personal**, quiero dar de alta un vino con sus añadas, bodega, varietal,
  sección y códigos de barras, para que aparezca en la carta.
- Como **personal**, quiero subir una foto de la botella (desde la computadora o
  sacándola con el celular), para que el cliente la vea en el detalle.
- Como **personal**, quiero recuperar mi contraseña por mail si me la olvido.
- Como **encargado**, quiero dar de alta, cambiar el rol y dar de baja a las personas
  del personal desde el panel, para no depender de Supabase.
- Como **personal**, quiero ponerle el año a las añadas "sin especificar", para
  ordenar lo que vino de Tango sin año.
- Como **personal**, quiero ocultar un producto o una sección sin borrarlos, para
  sacarlos de la carta por un tiempo.
- Como **personal**, quiero crear, renombrar y ocultar secciones, para organizar la
  carta.

## Criterios de aceptación

### CA-1: Ingreso solo para el personal
- **Dado** una persona que abre `/admin`
- **Cuando** no inició sesión
- **Entonces** ve el formulario de ingreso (email y contraseña) y nada del panel.
- Y con datos incorrectos ve "Email o contraseña incorrectos".
- Y un usuario que inicia sesión pero **no es del personal** ve "No tenés acceso al
  panel" y no puede ver ni cambiar nada.
- Y el personal puede cerrar sesión.

### CA-1b: Contraseña olvidada
- **Dado** una persona del personal que olvidó su contraseña
- **Cuando** toca "Olvidé mi contraseña" y escribe su email
- **Entonces** recibe un mail con un enlace para elegir una contraseña nueva, y con
  ella puede ingresar.
- Y el mensaje en pantalla es el mismo exista o no el email ("Si el email es del
  personal, te mandamos un enlace"), para no revelar quién tiene cuenta.

### CA-2: Lista y búsqueda de productos
- **Dado** el personal en el panel
- **Cuando** abre la lista de productos
- **Entonces** ve **todos** los productos, también los ocultos, sin stock o sin sección,
  con su estado a la vista (oculto, sin stock, añadas a revisar).
- Y puede buscar por nombre, bodega, código de Tango o código de barras.
- Y puede filtrar por sección y por "Ocultos", "Sin stock" y "A revisar" (con añadas
  sin especificar).

### CA-3: Stock con un toque
- **Dado** una añada en la lista o en la ficha del producto
- **Cuando** el personal toca su interruptor "Disponible / Sin stock"
- **Entonces** el cambio se guarda en el momento, sin otro botón, y se ve en la carta
  pública (ver CA-11).

### CA-4: Alta y edición de productos
- **Dado** el personal en el panel
- **Cuando** crea o edita un producto
- **Entonces** puede cargar tipo (vino, destilado, aceite, almacén), nombre, bodega
  (elegir una existente o crear una nueva), varietal, sección, descripción y si está
  visible.
- Y si falta un dato obligatorio (tipo, nombre) ve el error junto al campo y no se
  guarda nada.

### CA-5: Añadas
- **Dado** un producto
- **Cuando** el personal agrega, edita o borra una añada
- **Entonces** puede cargar código de Tango, descripción de Tango, tipo (con año, sin
  especificar, sin añada), año, precio y si hay stock.
- Y las reglas del modelo se respetan con mensajes claros, por ejemplo: "Ya existe una
  añada con el código VIrut0015", "Este vino ya tiene la añada 2020", "Un aceite tiene
  una sola presentación".
- Y una añada "sin especificar" se puede pasar a "con año" cargando el año.

### CA-6: Códigos de barras
- **Dado** un producto
- **Cuando** el personal agrega o quita un código de barras
- **Entonces** queda asociado al producto.
- Y si el código ya pertenece a otro producto ve cuál es ("El código 7798074860141 ya
  es de Salentein Primus Malbec").

### CA-7: Fotos
- **Dado** un producto
- **Cuando** el personal sube una foto (un archivo desde la computadora, o la cámara o
  la galería del celular)
- **Entonces** la foto se guarda, se ve en el panel y en el detalle de la carta.
- Y puede reemplazarla o quitarla.
- Y se rechazan archivos que no son imágenes o que pesan más de 10 MB, con un mensaje
  claro.

### CA-8: Ocultar, mostrar y borrar
- **Dado** un producto o una sección
- **Cuando** el personal lo oculta
- **Entonces** desaparece de la carta pública pero sigue en el panel, y se puede volver
  a mostrar.
- Y para borrar un producto se pide confirmación ("¿Borrar Rutini Malbec y sus 6
  añadas? No se puede deshacer."). Lo borrado se puede volver a crear (a mano o con la
  importación de la spec 8).

### CA-9: Secciones
- **Dado** el personal en el panel
- **Cuando** administra secciones
- **Entonces** puede crear, renombrar, ocultar y mostrar secciones. Una sección nueva
  queda al final de la carta. (El orden con arrastrar y soltar es la spec 5.)
- Y una sección con productos no se puede borrar: se ofrece ocultarla.

### CA-10: Pensado para la computadora, usable en el celular
- **Dado** el panel en una computadora (1366×768 o más)
- **Cuando** el personal lo usa
- **Entonces** la lista de productos aprovecha el ancho (tabla con columnas), se puede
  usar con teclado (buscar, recorrer y guardar con Enter) y axe no reporta errores
  graves.
- Y en un celular (390×844) todo sigue funcionando: la tabla pasa a tarjetas, los
  formularios a una columna y los elementos tocables miden al menos 44×44 px.

### CA-12: Alta y baja de personal
- **Dado** un **encargado** en el panel (ver la pregunta abierta 1)
- **Cuando** abre "Personal"
- **Entonces** ve la lista del personal (email, rol y si ya activó su cuenta).
- Y puede **invitar** a alguien con su email y rol (encargado o vendedor): la persona
  recibe un mail con un enlace para elegir su contraseña y entrar.
- Y puede **cambiar el rol** o **dar de baja** a alguien (con confirmación). Quien es
  dado de baja no puede volver a entrar.
- Y nadie puede darse de baja ni quitarse el rol de encargado a sí mismo, para que
  siempre quede al menos un encargado.

### CA-11: Los cambios se ven en la carta al instante
- **Dado** un cambio guardado desde el panel (precio, stock, producto, sección, foto)
- **Cuando** se abre la carta pública
- **Entonces** el cambio ya se ve, sin esperar el minuto de caché. (Los cambios hechos
  por fuera del panel, como la importación de la spec 8, siguen el minuto de caché.)

## Fuera de alcance
- Ordenar secciones y productos con arrastrar y soltar (spec 5).
- Textos editables de la carta e identidad de marca (spec 6).
- Descripciones con IA (spec 7).
- Importación desde Tango y actualización masiva de precios (spec 8).
- Historial de cambios o quién cambió qué.
- Otros permisos distintos entre roles: fuera de la gestión del personal (CA-12),
  encargado y vendedor pueden lo mismo.

## Decisiones tomadas en la revisión
- **Dispositivo:** principalmente la computadora; también usable en el celular.
- **Contraseña olvidada:** sí, por mail.
- **Alta de personal:** desde el panel (CA-12).
- **Borrar productos:** con confirmación; lo borrado se puede volver a crear.
- **Cambios al instante:** sí (CA-11).

## Preguntas abiertas
- [ ] 1. **¿Quién gestiona el personal?** Propuesta: **solo el encargado** puede
  invitar, cambiar roles y dar de baja (si no, un vendedor podría dar de baja al
  encargado). Para todo lo demás, encargado y vendedor siguen pudiendo lo mismo.
- [ ] 2. **Mails de invitación y de contraseña:** el servicio de mail incluido en
  Supabase solo manda a los emails del equipo de Supabase y unos pocos por hora: no
  sirve para el personal real. Hace falta conectar un servicio de envío a Supabase
  (SMTP). ¿Lehonor ya tiene correo con dominio propio (por ejemplo Google Workspace con
  `@lehonor.com`)? Propuesta: usar **Resend** (gratis hasta 3.000 mails por mes),
  enviando desde `no-responder@lehonor.com`; requiere agregar 3 registros en el DNS de
  `lehonor.com`, que manejan ustedes. Te guío paso a paso cuando lleguemos a esa tarea.

## Ideas para más adelante
- Invitar personal desde el panel.
- Historial de cambios de precio y stock.
- Recortar y enderezar la foto antes de subirla.
- Marcar varias añadas sin stock de una vez.
