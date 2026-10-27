# 004 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [ ] T1 — Ayudante e2e para iniciar sesión como personal (crea el usuario, guarda la
  sesión) y `proxy.ts` que refresca la sesión en `/admin/*`. (CA-1)
- [ ] T2 — `/admin/ingresar` con login, errores y redirección; protección de `/admin/*`
  (sin sesión, no personal); cerrar sesión; e2e. (CA-1)
- [ ] T3 — `buscar_admin()` sobre todos los productos, por nombre, bodega, código de
  Tango y código de barras; tests de base de datos. (CA-2)
- [ ] T4 — `/admin`: lista con estado (oculto, sin stock, a revisar), búsqueda y
  filtros en la URL; e2e. (CA-2)
- [ ] T5 — Etiquetar el caché de la carta con `cacheTag` y helper `invalidarCarta()`;
  test en modo producción de que un cambio desde una acción se ve al instante. (CA-11)
- [ ] T6 — `InterruptorStock` optimista y su acción; e2e que lo cambia y verifica la
  carta pública. (CA-3, CA-11)
- [ ] T7 — Validaciones y traducción de errores de Postgres a mensajes; tests
  unitarios. (CA-4, CA-5, CA-6)
- [ ] T8 — Alta y edición de producto con `SelectorBodega`; e2e con errores de campos
  obligatorios. (CA-4)
- [ ] T9 — `EditorAnadas`: agregar, editar (incluido pasar "sin especificar" a "con
  año"), borrar; mensajes de reglas; e2e. (CA-5)
- [ ] T10 — `EditorCodigos`: agregar y quitar códigos, mensaje si el código ya es de
  otro producto; e2e. (CA-6)
- [ ] T11 — Migración del bucket `fotos` con políticas; tests de base de datos. (CA-7)
- [ ] T12 — `SubirFoto` con reducción a 1600 px/WebP, reemplazar y quitar; e2e que
  sube una imagen y la ve en el detalle de la carta. (CA-7)
- [ ] T13 — Ocultar/mostrar producto y borrar con confirmación; e2e. (CA-8)
- [ ] T14 — `/admin/secciones`: crear al final, renombrar, ocultar/mostrar, no borrar
  con productos; e2e. (CA-9)
- [ ] T15 — Accesibilidad (axe) y tamaños tocables en todas las pantallas del panel;
  ajustes. (CA-10)
- [ ] T16 — README: cómo entra el personal y cómo se da de alta (sigue a mano en
  Supabase); verificación final. (CA-1)
