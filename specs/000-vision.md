# 000 – Visión del producto

**Estado:** Borrador (completar los puntos marcados con ⚠️)

## El problema
En la vinoteca, especialmente en la cava, una misma etiqueta existe en varias añadas
con precios distintos pero con el **mismo código de barras**. Hoy el cliente no tiene
una forma simple de ver qué añadas hay y cuánto cuesta cada una.

## La solución
Una carta virtual que el cliente abre escaneando un QR en el local. Desde ahí puede
buscar el vino que tiene enfrente y ver imagen, añadas disponibles, precio de cada una
y una descripción. El personal administra todo desde un panel simple, sin tocar código.

## Usuarios
- **Cliente en el local**: usa su celular, quiere encontrar rápido el vino y su precio.
- **Encargado**: carga y edita vinos, añadas, precios, fotos y el orden de la carta.
  Aprueba las descripciones sugeridas por la IA.
- **Vendedor**: ⚠️ ¿necesita acceso al panel? ¿con qué permisos?

## Capacidades (cada una será una spec)
1. Modelo de datos Vino → Añadas y proyecto base
2. Carta pública con buscador tolerante a errores (nombre, bodega, varietal, código)
3. Escaneo de código de barras con la cámara del celular
4. Panel admin con login: alta, edición, fotos, ocultar/mostrar
5. Orden visual de secciones y vinos (arrastrar y soltar)
6. Identidad de marca y textos editables de la carta
7. Descripciones sugeridas por IA con búsqueda web → borrador → aprobación humana
8. Importación masiva desde CSV/Excel, agrupando por código de barras
9. Deploy, dominio y QR imprimible

## Principios
- **Lo humano manda**: todo dato es editable desde el panel; la IA solo sugiere.
- **Solo se publica lo aprobado**: ninguna descripción de IA llega a la carta sin revisión.
- **Mobile-first y rápido**: tiene que cargar bien con la señal de adentro del local.
- **Con la estética de la marca**: colores, tipografía y logo propios.

## Fuera de alcance (por ahora)
Venta online, carrito, pagos, gestión de stock contable, maridajes automáticos.

## Datos del negocio a completar
- ⚠️ Sistema actual de stock/caja y si permite exportar a CSV/Excel:
- ⚠️ Secciones de la carta (ej.: Cava, Tintos, Blancos, Espumantes...):
- ⚠️ Cantidad aproximada de etiquetas y de añadas:
- ⚠️ Colores de marca (hex), tipografías y logo:
- ⚠️ ¿Mostrar stock al cliente o solo "disponible / sin stock"?
- ⚠️ ¿Mostrar añadas sin stock (como "agotada") o esconderlas?
- ⚠️ Dominio deseado (ej.: carta.mivinoteca.com):
