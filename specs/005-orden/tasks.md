# 005 – Tareas

Cada tarea: máximo 30 minutos, verificable con un test, referenciada a un criterio (CA-n).

- [x] T1 — Migración: `productos.orden` opcional (destacados), trigger al cambiar de
  sección, `producto_precio_min` y `bodega_orden` en `carta_publica`; seed y tipos;
  tests de base. (CA-2, CA-3)
- [x] T2 — Funciones `ordenar_secciones` y `ordenar_destacados` con sus validaciones y
  permisos; tests de base. (CA-1, CA-3)
- [ ] T3 — Orden de la sección en la carta (destacados, bodega, precio, nombre);
  unit + e2e con datos de prueba. (CA-2)
- [ ] T4 — `ListaOrdenable` con dnd-kit: mouse, teclado, anuncios en español y vuelta
  atrás si falla; e2e. (CA-1, CA-4)
- [ ] T5 — Secciones arrastrables en `/admin/secciones` con guardado automático; e2e
  que verifica la carta. (CA-1)
- [ ] T6 — `/admin/secciones/[id]`: destacados arrastrables, quitar y agregar desde
  el buscador; e2e que verifica la carta. (CA-3)
- [ ] T7 — Accesibilidad y celular: axe, manija de 44 px y scroll sin trabas. (CA-4)
