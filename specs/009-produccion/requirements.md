# 009 – Producción, dominio y QR

**Estado:** Aprobada (2026-11-04)

## Objetivo
Separar la carta que usan los clientes de la base de pruebas, publicarla en
`cava.lehonor.com` y tener una tarjeta con el QR para las mesas. Hoy la carta
publicada y los tests comparten la misma base: cada corrida de tests toca datos reales.

## Historias de usuario
- Como **cliente**, quiero **escanear el QR de la mesa** y abrir la carta en
  `cava.lehonor.com`.
- Como **encargado**, quiero **imprimir la tarjeta de mesa** con el QR desde el panel.
- Como **encargado**, quiero que **los datos que ya cargué** (productos importados,
  secciones, destacados, personal y fotos) **sigan estando** en producción.

## Criterios de aceptación
### CA-1: Base de producción propia
- **Dado** el sitio publicado (`cava.lehonor.com` y la versión principal en
  Vercel)
- **Cuando** alguien usa la carta o el panel
- **Entonces** lee y escribe en un proyecto de Supabase **de producción**, distinto del
  de desarrollo, con todas las migraciones aplicadas.
- Y las versiones de prueba de Vercel (ramas) y los tests siguen usando el proyecto de
  **desarrollo**: nunca tocan producción.

### CA-2: Los datos pasan a producción
- **Dado** lo cargado hasta ahora en la base de desarrollo
- **Cuando** se arma producción
- **Entonces** se copian tal cual: secciones y subsecciones, bodegas, productos,
  añadas, códigos de barras, destacados, abreviaturas, importaciones, marca (bienvenida
  y logo), promociones, sugerencias de la IA pendientes, personal (con sus usuarios y
  contraseñas: `ncensi` entra igual que hoy) y las fotos, logos e imágenes.
- Y no se copia nada creado por los tests (productos, secciones o usuarios `test-…`).
- Y se verifica que las cantidades coincidan antes de dar el paso por hecho.
- Y después la base de desarrollo vuelve a tener solo los datos de ejemplo.

### CA-3: Dominio
- **Dado** el dominio `cava.lehonor.com`
- **Cuando** alguien lo abre
- **Entonces** ve la carta con HTTPS. El panel queda en `cava.lehonor.com/admin`.

### CA-4: Tarjeta de mesa con QR
- **Dado** el encargado en el panel
- **Cuando** abre **Tarjeta QR**
- **Entonces** ve una tarjeta de **10 × 15 cm** lista para imprimir: el logo, el QR que
  lleva a `https://cava.lehonor.com` y el texto "Escaneá para ver la carta".
- Y con **Imprimir** sale del tamaño justo, sin el resto del panel (también se puede
  guardar como PDF desde la ventana de impresión).

### CA-5: Que el proyecto gratis no se pause
- **Dado** el plan gratis de Supabase, que pausa los proyectos sin uso durante 7 días
- **Cuando** pasa un día
- **Entonces** el sitio hace una consulta automática a la base de producción, para que
  no se pause aunque nadie abra la carta (por ejemplo, en vacaciones).

### CA-6: La IA en producción
- **Dado** producción
- **Cuando** se publica
- **Entonces** la IA de verdad (Gemini) funciona solo en producción y empieza
  **apagada** (la prende el encargado en **IA**); las versiones de prueba usan la IA de
  prueba y no gastan.
- Y una vez por día la cola de sugerencias avanza sola aunque nadie tenga el panel
  abierto (además de avanzar mientras el panel está abierto, spec 015).

### CA-7: Copia de seguridad
- **Dado** que el plan gratis no hace copias de seguridad automáticas
- **Cuando** el encargado (o quien mantenga el sistema) corre `npm run db:respaldo`
- **Entonces** se descarga a la computadora una copia de todos los datos de producción
  (un archivo por tabla), que se puede volver a cargar.

## Fuera de alcance
- Plan Pro de Supabase (se puede pasar más adelante sin cambiar nada de la app).
- Cartel A4 y QR suelto (solo la tarjeta de mesa).
- Que la carta aparezca en buscadores (Google).
- Estadísticas de visitas.

## Lo que tiene que hacer el encargado (no lo puedo hacer desde acá)
- **DNS:** crear en `lehonor.com` un registro `CNAME` con nombre `cava` →
  `cname.vercel-dns.com` (o el valor que muestre Vercel).
- **Vercel:** agregar el dominio al proyecto y cargar las variables de producción (las
  claves del proyecto nuevo, copiadas desde el panel de Supabase; nunca por el chat).
  En **Preview**: `IA_FALSA=1` (los previews no gastan IA). En **Production**:
  `GEMINI_API_KEY` y `CRON_SECRET`.

## Preguntas abiertas
- [x] **Proyecto de producción:** lo creo yo (gratis, misma región que desarrollo:
  Estados Unidos, junto a Vercel) — decidido el 2026-11-04.

## Decisiones tomadas en la revisión
- **Hosting:** Vercel y Supabase, planes gratuitos (de ahí CA-5 y CA-7).
- **Dominio:** `cava.lehonor.com` (2026-11-04).
- **Datos:** pasan tal cual a producción.
- **QR:** tarjeta de mesa de 10 × 15 cm.

## Ideas para más adelante
- Cartel A4 para vidriera y QR suelto para redes.
- Copia de seguridad automática semanal (por ejemplo, con una tarea programada).
