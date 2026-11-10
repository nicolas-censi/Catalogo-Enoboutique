# 017 – Diseño técnico

## Componentes
- `components/LogoMarca.tsx` (nuevo, servidor): sale de `Encabezado.tsx`; muestra el logo
  de `marcaCarta()` (o `public/logo-enoboutique.png`) con la clase que se le pase. Lo usan
  el encabezado de la carta y el panel. Mientras se lee la marca, el logo original (mismo
  tamaño, no salta nada).
- `MenuPanel` (servidor) le pasa a `NavPanel` (cliente) el logo como `marca: ReactNode`;
  `NavPanel` lo pone donde hoy está el texto `t.marca` (solo `md:`).
- Se borra `textos.admin.nav.marca` ("Lehonor"): ya no se usa.

## Datos
Sin cambios: `marca.logo_path` (spec 006). `marcaCarta()` ya se invalida al cambiar el logo.

## Tests
- E2E: en la computadora el menú muestra la imagen "Lehonor Enoboutique" y no el texto
  "Lehonor"; en el celular la barra no la muestra; con un logo subido, el menú usa ese
  archivo.
