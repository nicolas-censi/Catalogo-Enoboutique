# 009 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [x] T1 — Scripts `db:*` con `--produccion` (variables separadas y confirmación);
  `.env.example` y README. (CA-1)
- [ ] T2 — Crear el proyecto de producción y aplicar las migraciones; tipos iguales a
  desarrollo. (CA-1)
- [ ] T3 — Copiar datos, usuarios y fotos a producción, y verificar cantidades. (CA-2)
- [ ] T4 — Encargado: variables de producción en Vercel y dominio (DNS); verificación
  en `cava.lehonor.com`. (CA-1, CA-3)
- [x] T5 — `/api/salud` y crons diarios en `vercel.json` (salud y cola de la IA); e2e. (CA-5, CA-6)
- [x] T6 — `npm run db:respaldo`; test de que descarga todas las tablas. (CA-7)
- [ ] T7 — `/admin/qr`: tarjeta de mesa 10 × 15 imprimible; e2e. (CA-4)
- [ ] T8 — Desarrollo vuelve a tener solo datos de ejemplo. (CA-2)
