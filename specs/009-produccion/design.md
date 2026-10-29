# 009 – Diseño técnico

## Proyectos y variables
| Entorno | Supabase | Dónde se configura |
|---|---|---|
| Producción (`main`, dominio) | `enoboutique-prod` (nuevo, plan gratis, `us-east-1`) | Vercel → Environment Variables → **Production** |
| Versiones de prueba (ramas) | `enoboutique-dev` (el actual) | Vercel → **Preview** (sin cambios) |
| Local y tests | `enoboutique-dev` | `.env.local` / variables del entorno |

- Los scripts `db:*` usan el proyecto de `SUPABASE_PROJECT_REF`; con `--produccion`
  usan `SUPABASE_PROJECT_REF_PRODUCCION` (y piden confirmación escribiendo "produccion").
  Los tests nunca leen esas variables.
- Región `us-east-1`, igual que el desarrollo y que las funciones de Vercel: cada
  consulta del servidor viaja poco.

## Copia de datos (CA-2)
`scripts/copiar-a-produccion.mjs` (una sola vez, con confirmación):
1. Lee de desarrollo y escribe en producción por la API de administración (SQL), en
   orden de dependencias: `secciones` (primero las de primer nivel), `bodegas`,
   `abreviaturas`, `productos`, `anadas`, `codigos_barras`, `importaciones`.
2. Usuarios: copia de `auth.users` e `auth.identities` las cuentas del personal (con el
   hash de la contraseña, así entran igual) y después `personal`.
3. Fotos: copia los archivos del bucket `fotos` (mismas rutas).
4. Compara cantidades por tabla y lo informa.
Luego `npm run db:seed -- --solo-ejemplo` deja desarrollo con los datos de ejemplo
(borra lo que no es de ejemplo), recién cuando producción esté verificada.

## Rutas
| Ruta | Qué |
|---|---|
| `/admin/qr` | tarjeta de mesa imprimible (solo encargado) (CA-4) |
| `/api/salud` | consulta mínima a la base; la llama el cron diario de Vercel (CA-5) |

## Componentes y librerías
- QR: librería `qrcode` (genera SVG en el servidor; liviana, sin dependencias en el
  navegador). Es una dependencia nueva.
- Tarjeta: CSS de impresión con `@page { size: 100mm 150mm; margin: 0 }`; el resto del
  panel se oculta al imprimir. Colores de marca (tokens): fondo negro, logo y QR dorados
  sobre fondo claro para que lo lea cualquier celular (el QR necesita contraste: módulos
  oscuros sobre fondo claro).
- URL de la carta: `NEXT_PUBLIC_URL_CARTA` (por defecto `https://enoboutique.lehonor.com`).
- `vercel.json`: `crons: [{ path: "/api/salud", schedule: "0 12 * * *" }]` (una vez por
  día; el plan Hobby de Vercel lo permite).
- `scripts/respaldo.mjs` (`npm run db:respaldo`): descarga cada tabla de producción a
  `respaldos/AAAA-MM-DD/<tabla>.json` (carpeta ignorada por git).

## Tests
- Unit: armado de la URL del QR; orden de copia de tablas.
- E2E: `/admin/qr` (solo encargado, SVG del QR con la URL, tamaño de impresión);
  `/api/salud` responde 200.
- Verificación final en producción (manual, con el encargado): abrir el dominio,
  escanear el QR impreso, entrar al panel con `ncensi`.

## Riesgos
- Plan gratis: sin copias automáticas; el cron evita la pausa pero no reemplaza un
  respaldo. Se documenta correr `db:respaldo` cada tanto.
- Mientras se copia, conviene no editar el panel (unos minutos).
