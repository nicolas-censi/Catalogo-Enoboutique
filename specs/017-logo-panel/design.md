# 017 – Diseño técnico

## Componentes
- `components/LogoMarca.tsx` (nuevo, servidor): sale de `Encabezado.tsx`; muestra el logo
  de `marcaCarta()` (o `public/logo-enoboutique.png`) con la clase que se le pase. Lo usan
  el encabezado de la carta y el panel. Mientras se lee la marca, el logo original (mismo
  tamaño, no salta nada).
- `MenuPanel` (servidor) le pasa a `NavPanel` (cliente) el logo como `marca: ReactNode`;
  `NavPanel` lo pone donde hoy está el texto `t.marca` (solo `md:`).
- Se borra `textos.admin.nav.marca` ("Lehonor"): ya no se usa.

## Recorte automático del logo (CA-3)
- `lib/admin/logo.ts` (servidor): `recortarLogo(datos)` con `sharp`: `trim()` (toma como
  fondo el color de la esquina; sirve para transparente o liso), deja un margen de 1 %
  transparente y guarda en el mismo formato (PNG o WebP). Límite de píxeles como en
  `lib/ia/foto.ts`.
- `guardarLogo(ruta)` baja el archivo recién subido, lo recorta y lo vuelve a subir en la
  misma ruta antes de guardarlo en `marca`. Si el recorte falla, se usa tal cual.
- El logo que ya está subido no se toca: alcanza con volver a subirlo.
- `LogoMarca` suma `max-w-full` para que un logo muy ancho no se salga en el celular.

## Datos
Sin cambios: `marca.logo_path` (spec 006). `marcaCarta()` ya se invalida al cambiar el logo.

## Tests
- Unit: `recortarLogo` saca el margen transparente (1920×1080 con dibujo de 1900×556 →
  ≈ 1938×568), no cambia uno sin margen y mantiene el formato.
- E2E: en la computadora el menú muestra la imagen "Lehonor Enoboutique" y no el texto
  "Lehonor"; en el celular la barra no la muestra; con un logo subido, el menú usa ese
  archivo.
