// Capturas de pantalla para los manuales (docs/manual). Corre contra la base de
// DESARROLLO con datos de muestra (datos.ts) y deja todo como estaba al terminar.
// Uso: npm run manual:capturas
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";
import { CONTRASENA, preparar, restaurar, USUARIOS } from "./datos";

const SALIDA = join(__dirname, "capturas");
mkdirSync(SALIDA, { recursive: true });
const ROJO = "#C2410C";

type Marca = { en: Locator; n: number | string };

/** Recuadro y número sobre cada elemento a señalar. */
async function marcar(page: Page, marcas: Marca[]) {
  for (const m of marcas) {
    const el = m.en.first();
    const b = await el
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => el.boundingBox())
      .catch(() => null);
    if (!b) {
      console.log(`SIN MARCA ${page.url()} n=${m.n}`);
      continue;
    }
    // Dentro de un <dialog> abierto, las marcas van en el diálogo (si no, quedan debajo).
    await el.evaluate(
      (destino, { b, n, color }) => {
        const dialogo = destino.closest("dialog[open]") as HTMLElement | null;
        const padre = dialogo ?? document.body;
        let ox = -window.scrollX;
        let oy = -window.scrollY;
        if (dialogo) {
          const r = dialogo.getBoundingClientRect();
          ox = r.left + dialogo.clientLeft - dialogo.scrollLeft;
          oy = r.top + dialogo.clientTop - dialogo.scrollTop;
          dialogo.style.overflow = "visible";
        }
        const caja = document.createElement("div");
        caja.className = "manual-marca";
        Object.assign(caja.style, {
          position: "absolute",
          left: `${b.x - ox - 5}px`,
          top: `${b.y - oy - 5}px`,
          width: `${b.width + 10}px`,
          height: `${b.height + 10}px`,
          border: `3px solid ${color}`,
          borderRadius: "10px",
          boxShadow: "0 0 0 4px rgba(194,65,12,.15)",
          zIndex: "2147483646",
          pointerEvents: "none",
          margin: "0",
        });
        const numero = document.createElement("div");
        numero.className = "manual-marca";
        numero.textContent = String(n);
        Object.assign(numero.style, {
          position: "absolute",
          left: `${Math.max(dialogo ? -12 : 2, b.x - ox - 22)}px`,
          top: `${Math.max(dialogo ? -12 : 2, b.y - oy - 22)}px`,
          minWidth: "28px",
          height: "28px",
          padding: "0 6px",
          boxSizing: "border-box",
          borderRadius: "14px",
          background: color,
          color: "#fff",
          font: "700 15px/28px Helvetica, Arial, sans-serif",
          textAlign: "center",
          zIndex: "2147483647",
          pointerEvents: "none",
          margin: "0",
        });
        padre.append(caja, numero);
      },
      { b, n: m.n, color: ROJO },
    );
  }
}

async function limpiarMarcas(page: Page) {
  await page.evaluate(() => document.querySelectorAll(".manual-marca").forEach((e) => e.remove()));
}

/** Espera a que carguen las imágenes y oculta el indicador de desarrollo de Next. */
async function lista(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} *{caret-color:transparent!important}" });
  await page.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  // Hasta 10 s a que todas las imágenes visibles terminen de cargar.
  await page
    .waitForFunction(() => [...document.images].every((i) => !i.offsetParent || (i.complete && i.naturalWidth > 0)), null, { timeout: 10_000 })
    .catch(() => console.log(`IMÁGENES SIN CARGAR ${page.url()}`));
  await page.waitForTimeout(400);
}

async function captura(page: Page, nombre: string, marcas: Marca[] = [], opciones: { pagina?: boolean; recorte?: Locator } = {}) {
  await lista(page);
  await marcar(page, marcas);
  const archivo = join(SALIDA, `${nombre}.jpg`);
  let png: Buffer;
  if (opciones.recorte) {
    const b = (await opciones.recorte.boundingBox())!;
    const vp = page.viewportSize()!;
    const x = Math.max(0, b.x - 24);
    const y = Math.max(0, b.y - 24);
    png = await page.screenshot({ clip: { x, y, width: Math.min(vp.width - x, b.width + 48), height: b.height + 48 }, fullPage: true });
  } else {
    png = await page.screenshot({ fullPage: opciones.pagina ?? false });
  }
  await sharp(png).flatten({ background: "#F6F2E9" }).jpeg({ quality: 84, mozjpeg: true }).toFile(archivo);
  await limpiarMarcas(page);
}

async function ingresar(page: Page, usuario: string, prefijo: string, conCaptura: boolean) {
  await page.goto("/admin/ingresar");
  if (conCaptura) {
    await page.getByLabel("Usuario").fill(usuario);
    await page.getByLabel("Contraseña").fill("••••••••••");
    await captura(page, `${prefijo}-ingresar`, [
      { en: page.getByLabel("Usuario"), n: 1 },
      { en: page.getByLabel("Contraseña"), n: 2 },
      { en: page.getByRole("button", { name: "Ingresar" }), n: 3 },
    ], { recorte: page.locator("form").first() });
  }
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(CONTRASENA);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(/\/admin$/);
}

const menu = (page: Page) => page.getByRole("navigation", { name: "Panel" });

/** Lo que hacen los dos roles (cada uno con su menú). */
async function panelComun(page: Page, p: "v" | "e") {
  const esEncargado = p === "e";
  await ingresar(page, esEncargado ? USUARIOS.encargado : USUARIOS.vendedor, p, true);

  // Menú y lista de productos.
  await captura(page, `${p}-menu`, [
    { en: menu(page).getByRole("link", { name: /^Productos/ }), n: 1 },
    { en: menu(page).getByRole("link", { name: /^Secciones/ }), n: 2 },
    { en: menu(page).getByRole("link", { name: /^Para revisar/ }), n: 3 },
    { en: menu(page).getByRole("link", { name: esEncargado ? /^Ajustes/ : /^Cuenta/ }), n: 4 },
    { en: page.getByRole("link", { name: /Ver la carta/ }), n: 5 },
    { en: page.getByRole("button", { name: "Salir" }), n: 6 },
  ]);
  if (!esEncargado) {
    // El resto de las pantallas compartidas solo se capturan una vez (con el vendedor).
    await page.getByPlaceholder("Nombre, bodega, código de Tango o de barras").fill("malbec");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(800);
    await captura(page, "productos-buscar", [{ en: page.getByPlaceholder("Nombre, bodega, código de Tango o de barras"), n: 1 }]);
    await page.goto("/admin");
    await captura(page, "productos-lista", [
      { en: page.getByPlaceholder("Nombre, bodega, código de Tango o de barras"), n: 1 },
      { en: page.getByRole("link", { name: "Sin foto", exact: true }).or(page.getByRole("button", { name: "Sin foto", exact: true })).first(), n: 2 },
      { en: page.getByRole("combobox", { name: "Sección" }), n: 3 },
      { en: page.getByRole("link", { name: "Nuevo producto" }), n: 4 },
      { en: page.getByRole("button", { name: "Elegir varios" }), n: 5 },
      { en: page.getByRole("link", { name: /^Rutini Malbec/ }), n: 6 },
    ]);

    // Ficha: datos.
    await page.getByRole("link", { name: /^Rutini Malbec/ }).click();
    await page.waitForURL(/productos\//);
    await captura(
      page,
      "ficha-datos",
      [
        { en: page.getByRole("switch", { name: "Visible en la carta" }), n: 1 },
        { en: page.getByRole("link", { name: "Datos", exact: true }), n: 2 },
        { en: page.getByRole("link", { name: /^Añadas y precios/ }), n: 3 },
        { en: page.getByRole("link", { name: /^Códigos de barras/ }), n: 4 },
        { en: page.getByLabel("Descripción"), n: 5 },
        { en: page.getByRole("button", { name: "Guardar", exact: true }), n: 6 },
        { en: page.getByRole("button", { name: "Subir foto" }), n: 7 },
        { en: page.getByRole("button", { name: "Más acciones para Rutini Malbec" }), n: 8 },
      ],
      { pagina: true },
    );
    await page.getByRole("button", { name: "Más acciones para Rutini Malbec" }).click();
    await captura(page, "ficha-borrar", [{ en: page.getByRole("menuitem", { name: /Borrar/ }), n: 1 }]);
    await page.keyboard.press("Escape");

    // Ficha: añadas y precios.
    await page.getByRole("link", { name: /^Añadas y precios/ }).click();
    await page.waitForTimeout(800);
    await captura(
      page,
      "ficha-anadas",
      [
        { en: page.getByRole("switch", { name: "Stock de 2023" }), n: 1 },
        { en: page.getByRole("button", { name: "Más acciones para 2023" }), n: 2 },
        { en: page.getByRole("button", { name: "Agregar", exact: true }), n: 3 },
      ],
      { pagina: true },
    );
    await page.getByRole("button", { name: "Más acciones para 2023" }).click();
    await captura(page, "anada-menu", [
      { en: page.getByRole("menuitem", { name: "Editar" }), n: 1 },
      { en: page.getByRole("menuitem", { name: "Borrar" }), n: 2 },
    ]);
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await page.waitForTimeout(400);
    await captura(page, "anada-editar", [
      { en: page.getByLabel("Precio").first(), n: 1 },
      { en: page.getByRole("button", { name: "Guardar", exact: true }).first(), n: 2 },
    ]);
    await page.getByRole("button", { name: "Cancelar" }).first().click();
    await page.waitForTimeout(400);

    // Ficha: códigos de barras.
    await page.getByRole("link", { name: /^Códigos de barras/ }).click();
    await page.waitForURL(/codigos/).catch(() => {});
    await page.waitForTimeout(800);
    await captura(page, "ficha-codigos", [
      { en: page.getByLabel("Código de barras", { exact: true }), n: 1 },
      { en: page.getByRole("button", { name: /^Agregar/ }).last(), n: 2 },
    ]);

    // Sugerencia pendiente en la ficha.
    await page.goto("/admin");
    await page.getByRole("link", { name: /^Zuccardi Q Malbec Zuccardi/ }).click();
    await page.waitForURL(/productos\//);
    await captura(page, "ficha-aviso-ia", [{ en: page.getByRole("button", { name: "Revisar" }), n: 1 }]);

    // Sugerir con IA desde la ficha.
    await page.goto("/admin");
    await page.getByRole("link", { name: /^Salentein Brut Nature/ }).click();
    await page.waitForURL(/productos\//);
    await captura(page, "ficha-sugerir", [{ en: page.getByRole("button", { name: "Sugerir con IA" }), n: 1 }]);

    // Nuevo producto.
    await page.goto("/admin/productos/nuevo");
    await captura(
      page,
      "nuevo-producto",
      [
        { en: page.getByLabel("Tipo", { exact: true }), n: 1 },
        { en: page.getByLabel("Nombre", { exact: true }), n: 2 },
        { en: page.getByLabel("Sección", { exact: true }), n: 3 },
        { en: page.getByRole("button", { name: "Guardar", exact: true }), n: 4 },
      ],
      { pagina: true },
    );

    // Elegir varios: mover y sugerir con IA.
    await page.goto("/admin");
    await page.getByRole("button", { name: "Elegir varios" }).click();
    await page.getByRole("checkbox", { name: "Elegir Sal gourmet Salva Malbec" }).check();
    await page.getByRole("checkbox", { name: "Elegir Salentein Brut Nature" }).check();
    await captura(page, "elegir-varios", [
      { en: page.getByRole("checkbox", { name: "Elegir Salentein Brut Nature" }), n: 1 },
      { en: page.getByRole("button", { name: "Mover", exact: true }), n: 2 },
      { en: page.getByRole("button", { name: "Sugerir con IA" }), n: 3 },
    ]);
    await page.getByRole("button", { name: "Mover", exact: true }).click();
    await captura(page, "mover-dialogo", [
      { en: page.getByRole("combobox", { name: "Mover a la sección" }), n: 1 },
      { en: page.getByRole("dialog").getByRole("button", { name: "Mover", exact: true }), n: 2 },
    ]);
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
    await page.getByRole("button", { name: "Sugerir con IA" }).click();
    await expect(page.getByText(/Costo estimado/)).toBeVisible({ timeout: 15_000 });
    await captura(page, "sugerir-varios", [
      { en: page.getByText(/Costo estimado/), n: 1 },
      { en: page.getByRole("button", { name: "Sí, pedir" }), n: 2 },
    ]);
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

    // Para revisar.
    await page.goto("/admin/sugerencias");
    await captura(
      page,
      "para-revisar",
      [
        { en: page.getByRole("textbox", { name: "Descripción (podés corregirla)" }), n: 1 },
        { en: page.getByRole("heading", { name: "De dónde salió" }), n: 2 },
        { en: page.getByLabel("Usar la descripción"), n: 3 },
        { en: page.getByLabel("Usar la foto"), n: 4 },
        { en: page.getByRole("button", { name: "Aprobar" }), n: 5 },
        { en: page.getByRole("button", { name: "Descartar" }), n: 6 },
      ],
      { pagina: true },
    );

    // Secciones.
    await page.goto("/admin/secciones");
    await captura(page, "secciones", [
      { en: page.getByRole("button", { name: "Mover Cava" }), n: 1 },
      { en: page.getByRole("switch", { name: "Visible: Cava" }), n: 2 },
      { en: page.getByRole("button", { name: "Más acciones para Cava" }), n: 3 },
      { en: page.getByLabel("Nombre de la sección nueva"), n: 4 },
      { en: page.getByRole("button", { name: "Crear sección" }), n: 5 },
      { en: page.getByRole("link", { name: "Cava", exact: true }), n: 6 },
    ]);
    await page.getByRole("button", { name: "Más acciones para Cava" }).click();
    await captura(page, "seccion-menu", [
      { en: page.getByRole("menuitem", { name: "Renombrar" }), n: 1 },
      { en: page.getByRole("menuitem", { name: "Borrar" }), n: 2 },
    ]);
    await page.keyboard.press("Escape");
    await page.goto("/admin/secciones");
    await page.getByRole("link", { name: "Cava", exact: true }).click();
    await page.waitForURL(/secciones\//);
    await page.getByLabel("Agregar un producto de Cava").fill("malbec");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByRole("button", { name: "Agregar Rutini Malbec" })).toBeVisible();
    await captura(
      page,
      "seccion-detalle",
      [
        { en: page.getByLabel("Nombre de la subsección nueva"), n: 1 },
        { en: page.getByRole("button", { name: "Crear subsección" }), n: 2 },
        { en: page.getByLabel("Agregar un producto de Cava"), n: 3 },
        { en: page.getByRole("button", { name: "Agregar Rutini Malbec" }), n: 4 },
      ],
      { pagina: true },
    );

    // Celular.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");
    await captura(page, "celular-panel", [{ en: menu(page), n: "1–4" }]);
    await page.setViewportSize({ width: 1366, height: 768 });
  }

  // Ajustes (encargado) o Cuenta (vendedor).
  await page.goto("/admin/ajustes");
  await captura(page, `${p}-ajustes`, esEncargado ? [] : [{ en: page.getByRole("button", { name: "Salir" }).last(), n: 1 }]);
}

async function soloEncargado(page: Page) {
  // Importar desde Tango.
  await page.goto("/admin/importar");
  await captura(page, "importar", [
    { en: page.getByRole("button", { name: "Reporte de Tango (Excel o CSV)" }), n: 1 },
    { en: page.getByRole("button", { name: "Ver qué cambia" }), n: 2 },
    { en: page.getByRole("link", { name: "Diccionario de abreviaturas" }), n: 3 },
    { en: page.getByRole("link", { name: "Bodegas de Tango" }), n: 4 },
  ]);
  const csv = [
    "Cód. artículo;Descripción;Código de barras;Precio",
    "VIrut0080;RUTINI MAL 2023;;38500",
    "VIrut0079;RUTINI MAL 2022;;42000",
    "VIcat0001;CATENA ZAPATA MAL 2021;7790000000101;31000",
    "VIcat0002;CATENA ZAPATA CAB SAUV 2020;;29500",
  ].join("\n");
  await page.getByLabel("Reporte de Tango (Excel o CSV)").setInputFiles({ name: "precios-por-articulo.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await page.getByRole("button", { name: "Ver qué cambia" }).click();
  await expect(page.getByRole("heading", { name: "Resumen de la importación" })).toBeVisible({ timeout: 30_000 });
  await captura(
    page,
    "importar-resumen",
    [
      { en: page.getByRole("heading", { name: "Resumen de la importación" }), n: 1 },
      { en: page.getByRole("heading", { name: "Precios que cambian" }), n: 2 },
      { en: page.getByRole("heading", { name: "Productos nuevos" }), n: 3 },
      { en: page.getByRole("button", { name: "Importar", exact: true }), n: 4 },
    ],
    { pagina: true },
  );
  await page.goto("/admin/importar/abreviaturas");
  await captura(page, "abreviaturas", [
    { en: page.getByLabel("Abreviatura", { exact: true }), n: 1 },
    { en: page.getByLabel("Significa", { exact: true }), n: 2 },
    { en: page.getByRole("button", { name: "Guardar abreviatura" }), n: 3 },
  ]);
  await page.goto("/admin/importar/bodegas");
  await captura(page, "bodegas", [{ en: page.getByRole("button", { name: "Guardar" }).first(), n: 1 }]);

  // Promociones.
  await page.goto("/admin/promociones");
  await captura(page, "promociones", [
    { en: page.getByRole("button", { name: "Subir imágenes" }), n: 1 },
    { en: page.getByRole("button", { name: "Mover Promoción 1" }), n: 2 },
    { en: page.getByRole("switch", { name: "En la carta: Promoción 1" }), n: 3 },
    { en: page.getByRole("button", { name: "Más acciones para Promoción 1" }), n: 4 },
  ]);

  // Marca.
  await page.goto("/admin/marca");
  await captura(
    page,
    "marca",
    [
      { en: page.getByLabel("Bienvenida", { exact: true }), n: 1 },
      { en: page.getByRole("button", { name: "Guardar bienvenida" }), n: 2 },
      { en: page.getByRole("button", { name: "Logo nuevo" }), n: 3 },
    ],
    { pagina: true },
  );

  // IA.
  await page.goto("/admin/ia");
  await captura(page, "ia", [{ en: page.getByRole("switch", { name: "Sugerencias por IA" }), n: 1 }]);

  // Personal: solo los usuarios de ejemplo.
  await page.goto("/admin/personal");
  await lista(page);
  await page.evaluate((visibles) => {
    document.querySelectorAll("li, tr").forEach((fila) => {
      const t = fila.textContent ?? "";
      if (/Encargado|Vendedor/.test(t) && !visibles.some((v) => t.includes(v))) (fila as HTMLElement).style.display = "none";
    });
  }, Object.values(USUARIOS));
  await captura(page, "personal", [
    { en: page.getByRole("combobox", { name: "Rol de martin" }), n: 1 },
    { en: page.getByRole("button", { name: "Más acciones para martin" }), n: 2 },
    { en: page.getByLabel("Usuario", { exact: true }), n: 3 },
    { en: page.getByLabel("Contraseña", { exact: true }), n: 4 },
    { en: page.getByLabel("Rol", { exact: true }), n: 5 },
    { en: page.getByRole("button", { name: "Dar de alta" }), n: 6 },
  ]);
  await page.getByRole("button", { name: "Más acciones para martin" }).click();
  await captura(page, "personal-menu", [
    { en: page.getByRole("menuitem", { name: "Cambiar contraseña" }), n: 1 },
    { en: page.getByRole("menuitem", { name: "Dar de baja" }), n: 2 },
  ]);
  await page.keyboard.press("Escape");

  // Tarjeta QR.
  await page.goto("/admin/qr");
  await captura(page, "qr", [{ en: page.getByRole("button", { name: "Imprimir" }), n: 1 }], { pagina: true });
}

async function carta(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await captura(
    page,
    "carta-inicio",
    [
      { en: page.getByRole("searchbox", { name: "Buscá por vino, bodega, varietal o código" }), n: 1 },
      { en: page.getByRole("link", { name: "Escanear código" }), n: 2 },
      { en: page.getByRole("navigation", { name: "Secciones" }).getByRole("link").first(), n: 3 },
    ],
    { pagina: true },
  );
  await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Cava" }).click();
  await page.waitForURL(/seccion\//);
  await captura(page, "carta-seccion", [{ en: page.getByRole("link", { name: "Rutini Malbec", exact: true }), n: 1 }]);
  await page.getByRole("link", { name: "Rutini Malbec", exact: true }).click();
  await page.waitForURL(/producto\//);
  await captura(page, "carta-vino", [], { pagina: true });
  await page.goto("/buscar?q=malbec");
  await captura(page, "carta-buscar");
  await page.goto("/escanear");
  await page.waitForTimeout(1500);
  await captura(page, "carta-escanear", [{ en: page.getByLabel("Número del código de barras"), n: 1 }]);
  await page.setViewportSize({ width: 1366, height: 768 });
}

test.use({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2 });

test("capturas de los manuales", async ({ page, context }) => {
  await preparar();
  try {
    await panelComun(page, "v");
    await context.clearCookies();
    await panelComun(page, "e");
    await soloEncargado(page);
    await context.clearCookies();
    await carta(page);
  } finally {
    await restaurar();
  }
});
