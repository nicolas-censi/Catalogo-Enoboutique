// Lectura del reporte "Precios por artículo" de Tango (spec 008). Funciones puras: reciben
// las filas ya leídas del Excel (read-excel-file) o del CSV y devuelven los artículos.

export type TipoTango = "vino" | "combo" | "destilado" | "almacen" | "aceite";

export type ArticuloTango = {
  codigo: string;
  descripcion: string;
  codigoBarras: string | null;
  /** Lo que venía en la columna si no es un código válido (se avisa y no se importa). */
  codigoBarrasInvalido: string | null;
  /** null si en Tango está en cero o vacío: la carta muestra "Consultar precio". */
  precio: number | null;
  /** null: ese tipo de artículo no se importa (carnes, comidas, gift cards, otros). */
  tipo: TipoTango | null;
};

export type Reporte = { articulos: ArticuloTango[]; faltan: string[]; problemas: string[] };

const COLUMNAS = ["Cód. artículo", "Descripción", "Código de barras", "Precio"] as const;

/** El prefijo del código de Tango dice el tipo de artículo (CA-2). */
export function tipoPorCodigo(codigo: string): TipoTango | null {
  const c = codigo.toUpperCase();
  if (c.startsWith("VIKIT")) return "combo";
  if (c.startsWith("VI")) return "vino";
  if (c.startsWith("BA")) return "destilado";
  if (c.startsWith("AL") || c.startsWith("AB")) return "almacen";
  if (c.startsWith("AC")) return "aceite";
  return null;
}

const normalizar = (texto: unknown) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const texto = (valor: unknown) => (valor === null || valor === undefined ? "" : String(valor).trim());

/** Precio de Tango: número, o texto con formato argentino ("37.000,50"). */
function leerPrecio(valor: unknown): number | null {
  let numero: number;
  if (typeof valor === "number") numero = valor;
  else {
    const t = texto(valor).replace(/\$/g, "").replace(/\s/g, "");
    if (!t) return null;
    numero = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  }
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return Math.round(numero * 100) / 100;
}

export function leerReporte(filas: unknown[][]): Reporte {
  const encabezado = (filas[0] ?? []).map(normalizar);
  const posiciones = COLUMNAS.map((c) => encabezado.indexOf(normalizar(c)));
  const faltan = COLUMNAS.filter((_, i) => posiciones[i] === -1);
  if (faltan.length > 0) return { articulos: [], faltan: [...faltan], problemas: [] };
  const [pCodigo, pDescripcion, pBarras, pPrecio] = posiciones;

  const articulos: ArticuloTango[] = [];
  const problemas: string[] = [];
  const vistos = new Set<string>();
  filas.slice(1).forEach((fila, i) => {
    if (fila.every((v) => texto(v) === "")) return;
    const codigo = texto(fila[pCodigo]);
    const descripcion = texto(fila[pDescripcion]).replace(/\s+/g, " ");
    if (!codigo) return void problemas.push(`Fila ${i + 2}: no tiene código de artículo.`);
    if (vistos.has(codigo)) return void problemas.push(`${codigo}: el código está repetido en el archivo.`);
    if (!descripcion) return void problemas.push(`${codigo}: no tiene descripción.`);
    vistos.add(codigo);
    const barras = texto(fila[pBarras]).replace(/\s/g, "");
    const barrasValido = /^\d{8,14}$/.test(barras);
    articulos.push({
      codigo,
      descripcion,
      codigoBarras: barrasValido ? barras : null,
      codigoBarrasInvalido: barras && !barrasValido ? barras : null,
      precio: leerPrecio(fila[pPrecio]),
      tipo: tipoPorCodigo(codigo),
    });
  });
  return { articulos, faltan: [], problemas };
}

/** Filas de un CSV exportado de Tango: separador ";" o ",", con comillas dobles. */
export function filasDeCsv(contenido: string): string[][] {
  const limpio = contenido.replace(/^﻿/, "");
  const primeraLinea = limpio.split(/\r?\n/, 1)[0];
  const separador = primeraLinea.split(";").length > primeraLinea.split(",").length ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let entreComillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === separador) {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else campo += c;
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}
