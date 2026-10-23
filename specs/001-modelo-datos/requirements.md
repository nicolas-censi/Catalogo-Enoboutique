# 001 – Modelo de datos Vino → Añadas y proyecto base

**Estado:** Borrador

## Objetivo
Dejar armada la base sobre la que se construyen todas las demás specs: el proyecto
Next.js + Supabase funcionando y un modelo de datos que refleje cómo funciona la
vinoteca. Un producto (vino, destilado, aceite o almacén) se muestra una sola vez en
la carta, y cada añada corresponde a un artículo de Tango con su propio precio y stock.
Esta spec no incluye pantallas de carta ni de panel: solo la estructura, las reglas de
visibilidad y las herramientas de trabajo.

## Historias de usuario
- Como **cliente**, quiero ver cada vino una sola vez con todas sus añadas disponibles,
  para comparar precios sin buscar varias veces.
- Como **cliente**, quiero que la carta no me muestre lo que no hay, para no pedir algo
  que no está.
- Como **encargado o vendedor**, quiero que cada añada quede ligada a su código de
  artículo de Tango, para poder actualizar precios y stock de forma masiva más adelante.
- Como **encargado o vendedor**, quiero que solo el personal pueda modificar los datos,
  para que nadie de afuera altere la carta.
- Como **equipo de desarrollo**, queremos un proyecto base con tests, typecheck, lint y
  tokens de marca listos, para que cada spec siguiente arranque sobre algo sólido.

## Criterios de aceptación

### CA-1: Proyecto base funcionando
- **Dado** el repositorio recién clonado y con `.env.local` completo según `.env.example`
- **Cuando** corro `npm install` y después `npm run dev`, `npm run test`,
  `npm run test:e2e`, `npm run lint` y `npm run typecheck`
- **Entonces** todos funcionan y dan verde, y la página de inicio carga en un viewport
  de celular (390×844) sin errores en la consola.

### CA-2: Tokens de marca
- **Dado** el proyecto base
- **Cuando** reviso la configuración de Tailwind
- **Entonces** existen los tokens `negro` (`#000000`), `fondo` (`#F7F8FB`) y `dorado`
  (`#B19750`), la tipografía de títulos (Inknut Antiqua) y la de texto (Cabin), y la
  página de inicio los usa. No hay colores ni tipografías escritos a mano fuera de los
  tokens.

### CA-3: Un producto con varias añadas
- **Dado** un vino "Rutini Malbec" con las añadas 2018, 2020 y 2021, cada una con su
  código de artículo de Tango y su precio
- **Cuando** consulto la carta pública
- **Entonces** aparece **un solo** producto "Rutini Malbec" con sus 3 añadas, cada una
  con su precio, ordenadas de la más nueva a la más vieja.

### CA-4: Código de artículo de Tango único
- **Dado** una añada con el código de artículo `VIrut0015`
- **Cuando** intento guardar otra añada con el mismo código
- **Entonces** la base de datos lo rechaza.

### CA-5: Código de barras asociado al producto
- **Dado** un vino con 3 añadas y un código de barras `7798074860141` asociado al vino
- **Cuando** busco ese código de barras
- **Entonces** obtengo el vino con todas sus añadas disponibles.
- Y un mismo código de barras no puede pertenecer a dos productos distintos.

### CA-6: Productos que no son vino
- **Dado** un producto de tipo destilado, aceite o almacén
- **Cuando** le cargo una presentación
- **Entonces** queda con un único precio, sin año de añada.
- Y si intento agregarle una segunda presentación, la base de datos lo rechaza.

### CA-7: Tipos de añada
- **Dado** un vino
- **Cuando** cargo sus añadas
- **Entonces** cada añada puede tener un año (ej.: 2020), estar "sin especificar" (dato
  pendiente de revisar) o ser "sin añada" (ej.: espumantes no millésimés).
- Y no puede haber dos añadas del mismo año para el mismo vino.

### CA-8: Visibilidad en la carta pública
- **Dado** productos y añadas con distintos estados
- **Cuando** consulto la carta pública
- **Entonces**:
  - las añadas marcadas "Sin stock" no aparecen;
  - un producto sin ninguna añada con stock no aparece;
  - un producto oculto no aparece, aunque tenga stock;
  - un producto de una sección oculta no aparece;
  - las añadas sin precio no aparecen. ⚠️ Ver la pregunta abierta 1.
- Y la carta pública muestra "Disponible", nunca la cantidad de stock.

### CA-9: Secciones configurables
- **Dado** el modelo de datos
- **Cuando** creo, renombro, reordeno u oculto secciones
- **Entonces** la carta pública respeta el nombre y el orden de las secciones, y el
  orden de los productos dentro de cada sección.

### CA-10: Solo el personal escribe
- **Dado** un visitante sin sesión iniciada
- **Cuando** intenta leer datos que no están publicados (productos ocultos, añadas sin
  stock, códigos de Tango) o modificar cualquier dato
- **Entonces** la base de datos se lo impide.
- Y un usuario del personal (encargado o vendedor, que tienen los mismos permisos)
  puede leer y modificar todo.

### CA-11: Precios en ARS
- **Dado** un precio de 47000
- **Cuando** se formatea para mostrar
- **Entonces** se ve como `$ 47.000` (formato `es-AR`, sin decimales cuando son cero).

## Fuera de alcance
- Pantallas de la carta pública y del buscador (spec 2).
- Escaneo con la cámara (spec 3).
- Login y pantallas del panel admin (spec 4). En esta spec los usuarios del personal se
  dan de alta a mano desde el panel de Supabase.
- Ordenamiento con arrastrar y soltar (spec 5).
- Textos editables de la carta y logo en pantalla (spec 6).
- Descripciones por IA (spec 7).
- Importación desde Tango, diccionario de abreviaturas y actualización de precios y
  stock (spec 8).
- Deploy en Vercel, dominio y QR (spec 9).

## Preguntas abiertas
- [ ] 1. **Añadas sin precio** (58 artículos en el export): ¿se esconden de la carta
  (propuesta) o se muestran como "Consultar precio"?
- [ ] 2. **Cuentas:** ¿ya tienen cuentas de Supabase y Vercel? ¿Quién debería ser el
  dueño (por ejemplo, una cuenta con un mail del negocio)? Para esta spec alcanza con
  Supabase local, pero conviene definirlo antes de la spec 4.
- [ ] 3. **Bodega:** el export de Tango no trae la bodega como dato aparte (solo hay
  una abreviatura en el código, como `sal` = Salentein). ¿Está bien que la bodega sea
  un dato propio de la carta, que se completa en la importación o a mano?

## Ideas para más adelante
- Historial de cambios de precio por añada (útil para ver cómo impactó cada
  actualización desde Tango).
- Marca "requiere revisión" en productos y añadas, para la importación (spec 8).
