# 014 – Diseño técnico

## Tema del panel
- Hoy los colores están en `@theme inline` (Tailwind los escribe fijos en cada clase), así
  que no se pueden cambiar por zona. Se pasan a `@theme` normal (las clases usan
  `var(--color-…)`); las tipografías siguen en `@theme inline` (dependen de las variables
  de `next/font`).
- Tokens nuevos, también en `app/globals.css`: `--color-linea`, `--color-error`,
  `--color-dorado-texto` (dorado oscuro para texto chico sobre claro).
- `.tema-panel` (en el contenedor del panel y en el ingreso) redefine los tokens por
  función: fondo `#F6F2E9`, superficie `#FFFFFF`, texto `#1B1A17`, texto suave `#5E584C`,
  línea `#E3DBCB`, botón `#1B1A17` con texto `#F6F2E9`, título y destacado en texto,
  error `#A23A2A`; el dorado `#B19750` queda para detalles. Los componentes del panel ya
  usan los tokens por función, así que cambian solos; se revisa cada pantalla.
- Test de contraste (unit): cada par texto/fondo del tema del panel ≥ 4,5:1 (y ≥ 3:1
  para bordes de controles).

## Estructura
- `MarcoPanel`: en computadora, columna lateral fija (220 px) + contenido; en el celular,
  título arriba y `<nav>` fijo abajo con 3 o 4 íconos (Productos, Secciones, Para revisar,
  Ajustes). `aria-current="page"` en la opción activa.
- `/admin/ajustes` (encargado): lista de Importar, Promociones, Marca, IA y Personal con
  su descripción, más Ver la carta, usuario y Salir (en el celular).
- Componentes base nuevos en `components/admin/ui/`: `Boton` (principal | secundario |
  texto), `MenuAcciones` (⋯ con `<details>` o popover accesible, foco y Escape),
  `Confirmar`, `Chip`, `Pestanas` (con `?pestana=` en la URL), `BarraSeleccion`.

## Pantallas
| Ruta | Cambio |
|------|--------|
| `/admin` | Buscador + chips de filtro (son enlaces con parámetros: andan sin JavaScript), filas compactas, modo Elegir varios con barra fija |
| `/admin/productos/[id]` | Encabezado con foto y visible, aviso de IA, pestañas Datos · Añadas y precios · Códigos, ⋯ Borrar |
| `/admin/productos/nuevo` | Mismo formulario de Datos |
| `/admin/secciones`, `/admin/secciones/[id]` | Filas con manija, interruptor y ⋯ (Renombrar, Borrar); "Nueva sección" como botón principal |
| `/admin/personal` | Filas con rol y ⋯ (Cambiar contraseña, Dar de baja); "Dar de alta" principal |
| `/admin/promociones` | Igual criterio |
| `/admin/importar`, `/admin/marca`, `/admin/ia`, `/admin/sugerencias` | Tema y botones nuevos; sin cambios de función |
| `/admin/ingresar` | Tema claro |

- Precio de la fila: menor precio de las añadas con stock (de `productos_admin`; se
  agrega `precio_desde` a la vista si no está).

## Decisiones y alternativas descartadas
- Tema claro solo en el panel (pedido del usuario: "invertir los colores de la carta").
- Pestañas en lugar de una página larga: la ficha es lo más usado y hoy es lo más largo.
- Barra inferior en el celular en lugar de ☰: las tres secciones diarias a un toque.

## Riesgos
- Muchos tests e2e buscan botones y textos por nombre: se adaptan en cada tarea (mismos
  criterios, nueva ubicación).
- Pasar los colores a `@theme` normal no debe cambiar la carta: test visual de la carta
  (capturas antes/después) y los e2e de la carta.
