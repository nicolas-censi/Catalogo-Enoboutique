// Validaciones de los formularios del panel. Funciones puras: se usan en las Server
// Actions antes de guardar (la base vuelve a validar con sus propias reglas).
import type { Database } from "@/lib/tipos-db";

type Enums = Database["public"]["Enums"];
export type TipoProducto = Enums["tipo_producto"];
export type TipoAnada = Enums["tipo_anada"];

const TIPOS_PRODUCTO: TipoProducto[] = ["vino", "destilado", "aceite", "almacen"];
const TIPOS_ANADA: TipoAnada[] = ["con_anio", "sin_especificar", "sin_anada"];

export const MENSAJES = {
  tipo: "Elegí el tipo de producto.",
  nombre: "Escribí el nombre.",
  codigoTango: "Escribí el código de Tango.",
  tipoAnada: "Elegí el tipo de añada.",
  anio: "Escribí el año (por ejemplo, 2020).",
  precio: "Escribí el precio en números (por ejemplo, 47.000).",
  codigoBarras: "El código de barras tiene que tener entre 8 y 14 números.",
} as const;

/** "Un aceite", "Un destilado", "Un producto de almacén". */
export function unProducto(tipo: TipoProducto): string {
  return tipo === "almacen" ? "Un producto de almacén" : `Un ${tipo}`;
}

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");
const textoONulo = (valor: unknown) => texto(valor) || null;

type Resultado<T, C extends string> = { datos: T | null; errores: Partial<Record<C, string>> };

export function validarProducto(entrada: {
  tipo?: unknown;
  nombre?: unknown;
  varietal?: unknown;
  descripcion?: unknown;
  visible?: unknown;
}): Resultado<
  { tipo: TipoProducto; nombre: string; varietal: string | null; descripcion: string | null; visible: boolean },
  "tipo" | "nombre"
> {
  const errores: Partial<Record<"tipo" | "nombre", string>> = {};
  const tipo = texto(entrada.tipo) as TipoProducto;
  const nombre = texto(entrada.nombre);
  if (!TIPOS_PRODUCTO.includes(tipo)) errores.tipo = MENSAJES.tipo;
  if (!nombre) errores.nombre = MENSAJES.nombre;
  if (Object.keys(errores).length > 0) return { datos: null, errores };
  return {
    datos: {
      tipo,
      nombre,
      varietal: textoONulo(entrada.varietal),
      descripcion: textoONulo(entrada.descripcion),
      visible: entrada.visible !== false,
    },
    errores,
  };
}

/**
 * Lee un precio como lo escribe una persona en Argentina: "47.000", "$ 47.000",
 * "47000,50". Vacío → null (sin precio). Inválido → NaN.
 */
export function leerPrecio(entrada: string): number | null {
  const limpio = entrada.replace(/\$/g, "").replace(/\s/g, "");
  if (!limpio) return null;
  if (!/^\d[\d.]*(,\d{1,2})?$/.test(limpio)) return Number.NaN;
  return Number(limpio.replace(/\./g, "").replace(",", "."));
}

export function validarAnada(
  entrada: {
    codigoTango?: unknown;
    descripcionTango?: unknown;
    tipo?: unknown;
    anio?: unknown;
    precio?: unknown;
    enStock?: unknown;
  },
  tipoProducto: TipoProducto,
): Resultado<
  {
    codigo_tango: string;
    descripcion_tango: string;
    tipo: TipoAnada;
    anio: number | null;
    precio: number | null;
    en_stock: boolean;
  },
  "codigoTango" | "tipo" | "anio" | "precio"
> {
  const errores: Partial<Record<"codigoTango" | "tipo" | "anio" | "precio", string>> = {};
  const codigo = texto(entrada.codigoTango);
  const tipo = texto(entrada.tipo) as TipoAnada;
  const anioTexto = texto(entrada.anio);
  const precio = leerPrecio(texto(entrada.precio));

  if (!codigo) errores.codigoTango = MENSAJES.codigoTango;
  if (!TIPOS_ANADA.includes(tipo)) errores.tipo = MENSAJES.tipoAnada;
  else if (tipoProducto !== "vino" && tipo !== "sin_anada") {
    errores.tipo = `${unProducto(tipoProducto)} tiene una sola presentación, sin año.`;
  }
  let anio: number | null = null;
  if (tipo === "con_anio") {
    anio = /^\d{4}$/.test(anioTexto) ? Number(anioTexto) : Number.NaN;
    if (!(anio >= 1900 && anio <= 2100)) errores.anio = MENSAJES.anio;
  }
  if (Number.isNaN(precio)) errores.precio = MENSAJES.precio;

  if (Object.keys(errores).length > 0) return { datos: null, errores };
  return {
    datos: {
      codigo_tango: codigo,
      descripcion_tango: texto(entrada.descripcionTango),
      tipo,
      anio,
      precio,
      en_stock: entrada.enStock === true,
    },
    errores,
  };
}

export function validarCodigoBarras(entrada: string): { codigo: string; error: string | null } {
  const codigo = entrada.replace(/\s/g, "");
  return { codigo, error: /^\d{8,14}$/.test(codigo) ? null : MENSAJES.codigoBarras };
}

export const LARGO_MINIMO_CONTRASENA = 8;

export function validarContrasena(nueva: string, repetida: string): Partial<Record<"nueva" | "repetida", string>> {
  if (nueva.length < LARGO_MINIMO_CONTRASENA) return { nueva: "Tiene que tener al menos 8 caracteres." };
  if (nueva !== repetida) return { repetida: "Las contraseñas no coinciden." };
  return {};
}
