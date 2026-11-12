// Genera los manuales (vendedores y encargado) en HTML y PDF a partir de contenido.mjs y
// de las capturas de docs/manual/capturas.
// Uso: npm run manual  (después de npm run manual:capturas)
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { MANUALES, SECCIONES } from "./contenido.mjs";

const RAIZ = new URL(".", import.meta.url).pathname;
const SALIDA = join(RAIZ, "salida");
mkdirSync(SALIDA, { recursive: true });

const fecha = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date());
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "@v texto para vendedor@e texto para encargado" → el del rol. */
function paraRol(texto, rol) {
  if (!texto || !/@[ve] /.test(texto)) return texto;
  const partes = Object.fromEntries([...texto.matchAll(/@([ve]) ([^@]*)/g)].map((m) => [m[1], m[2].trim()]));
  return partes[rol] ?? "";
}

/** Negritas para los nombres de botones y opciones que el texto menciona. */
function enriquecer(texto) {
  return esc(texto).replace(/^([^:]{2,60}):\s/, "<strong>$1:</strong> ");
}

/** Ancho en pantalla de cada captura (están a doble resolución). */
const ANCHOS = {};

function bloqueHtml(b, rol, base) {
  const img = b.img ?? (rol === "v" ? b.imgV : b.imgE);
  const pasos = (b.pasos ?? []).map((p) => paraRol(p, rol)).filter(Boolean);
  const texto = paraRol(b.texto, rol);
  const nota = paraRol(b.nota, rol);
  const consejo = paraRol(b.consejo, rol);
  const existe = img && existsSync(join(RAIZ, "capturas", `${img}.jpg`));
  const figura = existe
    ? `<figure class="captura${b.celular ? " celular" : ""}"><img src="${base}/${img}.jpg" style="max-width:min(100%, ${ANCHOS[img] ?? 1366}px)" alt="Captura: ${esc(b.subtitulo ?? img)}" loading="lazy"></figure>`
    : "";
  const lista = pasos.length
    ? `<ol class="pasos${pasos.length === 1 && !figura ? " uno" : ""}">${pasos.map((p) => `<li><span>${enriquecer(p)}</span></li>`).join("")}</ol>`
    : "";
  return `<div class="bloque${b.celular ? " con-celular" : ""}">
    ${b.subtitulo ? `<h3>${esc(b.subtitulo)}</h3>` : ""}
    ${texto ? `<p class="texto">${esc(texto)}</p>` : ""}
    <div class="cuerpo">${figura}<div class="explicacion">${lista}
    ${nota ? `<p class="aviso nota"><span>Tené en cuenta</span>${esc(nota)}</p>` : ""}
    ${consejo ? `<p class="aviso consejo"><span>Consejo</span>${esc(consejo)}</p>` : ""}</div></div>
  </div>`;
}

const ESTILO = `
:root {
  /* Manual impreso y en pantalla con los colores de la marca: crema, casi negro y el
     dorado solo en detalles. El rojo ladrillo es el de las marcas de las capturas. */
  --papel: #F6F2E9;
  --hoja: #FFFFFF;
  --tinta: #1B1A17;
  --tinta-suave: #5E584C;
  --linea: #E3DBCB;
  --dorado: #B19750;
  --dorado-texto: #7A6428;
  --marca: #C2410C;
  --marca-fondo: #FBEDE6;
  --titulos: "Inknut Antiqua", Georgia, "Times New Roman", serif;
  --texto: "Cabin", "Helvetica Neue", Arial, sans-serif;
  color-scheme: light;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--papel); color: var(--tinta); font: 16px/1.6 var(--texto); }
.hoja { max-width: 64rem; margin: 0 auto; padding-block: 2.5rem 4rem;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
header.portada { display: grid; gap: .75rem; padding-bottom: 2rem; border-bottom: 1px solid var(--linea); }
.isotipo { width: 64px; height: 64px; }
.rol { justify-self: start; font-size: .8rem; letter-spacing: .08em; text-transform: uppercase; color: var(--dorado-texto);
  border: 1px solid var(--dorado); border-radius: 999px; padding: .15rem .7rem; }
h1 { font: 600 clamp(1.8rem, 4vw, 2.6rem)/1.25 var(--titulos); margin: 0; text-wrap: balance; }
.bajada { margin: 0; font-size: 1.1rem; color: var(--tinta-suave); max-width: 46rem; }
.meta { margin: 0; font-size: .9rem; color: var(--tinta-suave); }
.leyenda { display: flex; gap: .75rem; align-items: center; margin-top: .5rem; font-size: .95rem; color: var(--tinta-suave); }
.ejemplo { flex: none; display: inline-grid; place-items: center; min-width: 1.6rem; height: 1.6rem; border-radius: 999px; background: var(--marca); color: #fff; font: 700 .85rem/1 var(--texto); }
nav.indice { margin-block: 2rem; }
nav.indice h2 { font: 600 1rem var(--texto); letter-spacing: .08em; text-transform: uppercase; color: var(--tinta-suave); margin: 0 0 .75rem; }
nav.indice ol { margin: 0; padding: 0; list-style: none; columns: 2 18rem; column-gap: 2rem; counter-reset: cap; }
nav.indice li { counter-increment: cap; break-inside: avoid; padding-block: .3rem; border-bottom: 1px solid var(--linea); }
nav.indice li::before { content: counter(cap) "."; display: inline-block; width: 2rem; color: var(--dorado-texto); font-variant-numeric: tabular-nums; }
nav.indice a { color: var(--tinta); text-decoration: none; }
nav.indice a:hover, nav.indice a:focus-visible { text-decoration: underline; }
section.capitulo { padding-top: 2.5rem; counter-increment: capitulo; }
main { counter-reset: capitulo; }
section.capitulo > h2 { font: 600 1.7rem/1.3 var(--titulos); margin: 0 0 .5rem; text-wrap: balance; }
section.capitulo > h2::before { content: counter(capitulo); display: block; font: 600 .8rem var(--texto); letter-spacing: .12em; color: var(--dorado-texto); }
section.capitulo > h2::after { content: ""; display: block; width: 2.5rem; height: 1px; background: var(--dorado); margin-top: .6rem; }
.intro { max-width: 46rem; color: var(--tinta-suave); margin: .75rem 0 1rem; }
.bloque { margin-top: 1.75rem; }
h3 { font: 700 1.15rem/1.35 var(--texto); margin: 0 0 .5rem; }
.texto { margin: 0 0 .75rem; max-width: 46rem; }
.cuerpo { display: grid; gap: 1rem; }
.con-celular .cuerpo { grid-template-columns: minmax(0, 300px) minmax(0, 1fr); align-items: start; }
.captura { margin: 0; }
.captura img { display: block; width: 100%; margin-inline: auto; max-width: 100%; height: auto; border: 1px solid var(--linea); border-radius: 10px; background: var(--hoja); box-shadow: 0 1px 2px rgba(27,26,23,.06); }
.celular img { border-radius: 18px; }
.explicacion { min-width: 0; display: grid; gap: .75rem; align-content: start; }
ol.pasos { margin: 0; padding: 0; list-style: none; counter-reset: paso; display: grid; gap: .55rem; max-width: 52rem; }
ol.pasos li { counter-increment: paso; display: grid; grid-template-columns: 1.8rem minmax(0, 1fr); gap: .6rem; align-items: start; }
ol.pasos li::before { content: counter(paso); display: grid; place-items: center; width: 1.6rem; height: 1.6rem; margin-top: .05rem; border-radius: 999px; background: var(--marca); color: #fff; font: 700 .85rem/1 var(--texto); }
ol.pasos.uno li::before { content: "→"; background: var(--tinta); }
.aviso { margin: 0; padding: .75rem 1rem; border-radius: 10px; max-width: 52rem; background: var(--hoja); border: 1px solid var(--linea); }
.aviso span { display: block; font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; margin-bottom: .15rem; }
.aviso.nota span { color: var(--tinta-suave); }
.aviso.consejo { background: var(--marca-fondo); border-color: #F3D2C2; }
.aviso.consejo span { color: var(--marca); }
footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--linea); font-size: .85rem; color: var(--tinta-suave); }
@media (max-width: 640px) { .con-celular .cuerpo { grid-template-columns: 1fr; } .celular { max-width: 300px; } }
@media print {
  body { background: #fff; font-size: 11pt; }
  .hoja { max-width: none; padding: 0; }
  section.capitulo { break-before: page; padding-top: 0; }
  .bloque, .aviso, ol.pasos li, .captura { break-inside: avoid; }
  .bloque > h3, .bloque > .texto { break-after: avoid; }
  .captura img { box-shadow: none; }
  nav.indice a { color: var(--tinta); }
  a[href^="#"] { text-decoration: none; }
}
`;

const ISOTIPO = (base) => `<img class="isotipo" src="${base}/isotipo.png" alt="">`;

function documento(rol, base) {
  const m = MANUALES[rol];
  const secciones = SECCIONES.filter((s) => s.para.includes(rol));
  const indice = secciones.map((s) => `<li><a href="#${s.id}">${esc(s.titulo)}</a></li>`).join("");
  const cuerpo = secciones
    .map(
      (s) => `<section class="capitulo" id="${s.id}">
  <h2>${esc(s.titulo)}</h2>
  ${s.intro ? `<p class="intro">${esc(paraRol(s.intro, rol))}</p>` : ""}
  ${s.bloques.map((b) => bloqueHtml(b, rol, base)).join("\n")}
</section>`,
    )
    .join("\n");
  return `<title>${esc(m.titulo)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;700&family=Inknut+Antiqua:wght@600&display=swap">
<style>${ESTILO}</style>
<div class="hoja">
  <header class="portada">
    ${ISOTIPO(base)}
    <span class="rol">${rol === "v" ? "Para vendedores" : "Para el encargado"}</span>
    <h1>${esc(m.titulo)}</h1>
    <p class="bajada">${esc(m.bajada)}</p>
    <p class="meta">Lehonor Enoboutique · Panel de la carta (cava.lehonor.com/admin) · ${esc(fecha)}</p>
    <p class="leyenda"><span class="ejemplo">1</span><span>En cada captura, los números marcan dónde tocar. La lista de abajo explica cada uno en el mismo orden.</span></p>
  </header>
  <nav class="indice" aria-labelledby="titulo-indice"><h2 id="titulo-indice">Contenido</h2><ol>${indice}</ol></nav>
  <main>${cuerpo}</main>
  <footer>Las capturas son del sistema de prueba, con productos de ejemplo. En el sistema real vas a ver la carta completa, pero los botones y los pasos son los mismos.</footer>
</div>`;
}

for (const f of (await import("node:fs")).readdirSync(join(RAIZ, "capturas")).filter((f) => f.endsWith(".jpg"))) {
  ANCHOS[f.replace(/\.jpg$/, "")] = Math.round((await sharp(join(RAIZ, "capturas", f)).metadata()).width / 2);
}

const navegador = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
for (const rol of ["v", "e"]) {
  const { archivo, titulo } = MANUALES[rol];
  // Página para publicar: las capturas van al lado, en capturas/.
  writeFileSync(join(SALIDA, `${archivo}.html`), documento(rol, "capturas"));
  // PDF: mismo contenido, con las capturas de la carpeta del repositorio.
  const completo = `<!doctype html><html lang="es"><head><meta charset="utf-8">${documento(rol, "../capturas")}`.replace(
    "<div class=\"hoja\">",
    "</head><body><div class=\"hoja\">",
  ) + "</body></html>";
  const ruta = join(SALIDA, `.${archivo}-pdf.html`);
  writeFileSync(ruta, completo);
  const pagina = await navegador.newPage();
  await pagina.goto(`file://${ruta}`, { waitUntil: "networkidle" });
  await pagina.evaluate(async () => {
    document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => ((i.onload = r), (i.onerror = r))))));
    await document.fonts.ready;
  });
  await pagina.pdf({
    path: join(SALIDA, `${archivo}.pdf`),
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font:8px Helvetica,Arial,sans-serif;color:#5E584C;padding:0 16mm;text-align:right">${titulo}</div>`,
    footerTemplate: `<div style="width:100%;font:8px Helvetica,Arial,sans-serif;color:#5E584C;padding:0 16mm;text-align:center">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
  });
  await pagina.close();
  console.log(`Listo: docs/manual/salida/${archivo}.html y .pdf`);
}
await navegador.close();
