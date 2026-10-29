// Datos propios para los tests de búsqueda: la base de desarrollo tiene los productos
// reales de Tango, así que cada archivo de test usa una marca y una bodega inventadas,
// únicas, en vez de los datos de ejemplo.
import { randomInt } from "node:crypto";
import { clienteAdmin, prefijo } from "../db/ayudante";

const admin = clienteAdmin();
const letras = (n: number) => Array.from({ length: n }, () => String.fromCharCode(97 + randomInt(26))).join("");
const titulo = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
let contador = 0;

async function insertar(tabla: string, fila: Record<string, unknown>) {
  const { data, error } = await admin.from(tabla).insert(fila).select().single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export type DatosBusqueda = Awaited<ReturnType<typeof crearDatosBusqueda>>;

export async function crearDatosBusqueda() {
  const marca = titulo(`velmor${letras(4)}`);
  const bodega = titulo(`quintal${letras(4)}`);
  const nombres = {
    malbec: `${marca} Malbec`,
    reserva: `${marca} Gran Reserva`,
    chardonnay: `${bodega} Chardonnay`,
    escondido: `${marca} Escondido`,
  };
  const productos: string[] = [];
  const producto = async (nombre: string, seccion: string, bodegaId: string | null, anios: [number, number][]) => {
    const id = await insertar("productos", { tipo: "vino", nombre, seccion_id: seccion, bodega_id: bodegaId });
    productos.push(id);
    for (const [anio, precio] of anios) {
      await insertar("anadas", {
        producto_id: id,
        codigo_tango: `${prefijo}-busq-${++contador}-${letras(4)}`,
        descripcion_tango: nombre.toUpperCase(),
        tipo: "con_anio",
        anio,
        precio,
        en_stock: true,
      });
    }
  };

  // "test-…": el test del inicio ignora estas secciones.
  const visible = await insertar("secciones", { nombre: `${prefijo} Búsqueda ${marca}`, orden: 90000 });
  const oculta = await insertar("secciones", { nombre: `${prefijo} Oculta ${marca}`, orden: 90001, visible: false });
  const bodegaId = await insertar("bodegas", { nombre: bodega });
  await producto(nombres.malbec, visible, bodegaId, [
    [2023, 36000],
    [2021, 43000],
  ]);
  await producto(nombres.reserva, visible, bodegaId, [[2019, 90000]]);
  await producto(nombres.chardonnay, visible, bodegaId, [[2022, 20000]]);
  await producto(nombres.escondido, oculta, null, [[2020, 10000]]);

  return {
    marca,
    bodega,
    nombres,
    async borrar() {
      await admin.from("productos").delete().in("id", productos);
      await admin.from("secciones").delete().in("id", [visible, oculta]);
      await admin.from("bodegas").delete().eq("id", bodegaId);
    },
  };
}
