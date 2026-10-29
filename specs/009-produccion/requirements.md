# 009 – Producción, dominio y QR

**Estado:** Borrador

## Objetivo
Separar la carta que usan los clientes de la base de pruebas, publicarla en
`enoboutique.lehonor.com` y tener una tarjeta con el QR para las mesas. Hoy la carta
publicada y los tests comparten la misma base: cada corrida de tests toca datos reales.

## Historias de usuario
- Como **cliente**, quiero **escanear el QR de la mesa** y abrir la carta en
  `enoboutique.lehonor.com`.
- Como **encargado**, quiero **imprimir la tarjeta de mesa** con el QR desde el panel.
- Como **encargado**, quiero que **los datos que ya cargué** (productos importados,
  secciones, destacados, personal y fotos) **sigan estando** en producción.

## Criterios de aceptación
### CA-1: Base de producción propia
- **Dado** el sitio publicado (`enoboutique.lehonor.com` y la versión principal en
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
  añadas, códigos de barras, destacados, abreviaturas, importaciones, personal (con sus
  usuarios y contraseñas: `ncensi` entra igual que hoy) y las fotos.
- Y se verifica que las cantidades coincidan antes de dar el paso por hecho.
- Y después la base de desarrollo vuelve a tener solo los datos de ejemplo.

### CA-3: Dominio
- **Dado** el dominio `enoboutique.lehonor.com`
- **Cuando** alguien lo abre
- **Entonces** ve la carta con HTTPS. El panel queda en `enoboutique.lehonor.com/admin`.

### CA-4: Tarjeta de mesa con QR
- **Dado** el encargado en el panel
- **Cuando** abre **Tarjeta QR**
- **Entonces** ve una tarjeta de **10 × 15 cm** lista para imprimir: el logo, el QR que
  lleva a `https://enoboutique.lehonor.com` y el texto "Escaneá para ver la carta".
- Y con **Imprimir** sale del tamaño justo, sin el resto del panel (también se puede
  guardar como PDF desde la ventana de impresión).

### CA-5: Que el proyecto gratis no se pause
- **Dado** el plan gratis de Supabase, que pausa los proyectos sin uso durante 7 días
- **Cuando** pasa un día
- **Entonces** el sitio hace una consulta automática a la base de producción, para que
  no se pause aunque nadie abra la carta (por ejemplo, en vacaciones).

### CA-6: Copia de seguridad
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
- **DNS:** crear en `lehonor.com` un registro `CNAME` `enoboutique` →
  `cname.vercel-dns.com` (o el valor que muestre Vercel).
- **Vercel:** agregar el dominio al proyecto y cargar las variables de producción (las
  claves del proyecto nuevo, copiadas desde el panel de Supabase; nunca por el chat).

## Preguntas abiertas
- [ ] **¿Creo yo el proyecto de producción** (gratis) con el acceso a Supabase que ya
  tengo configurado, o lo creás vos desde el panel de Supabase? Propuesta: lo creo yo,
  en la misma región que el de desarrollo (Estados Unidos, junto a Vercel).

## Decisiones tomadas en la revisión
- **Plan de Supabase:** gratis por ahora (de ahí CA-5 y CA-6).
- **Datos:** pasan tal cual a producción.
- **QR:** tarjeta de mesa de 10 × 15 cm.

## Ideas para más adelante
- Cartel A4 para vidriera y QR suelto para redes.
- Copia de seguridad automática semanal (por ejemplo, con una tarea programada).
