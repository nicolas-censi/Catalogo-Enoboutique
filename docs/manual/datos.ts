// Datos de muestra para las capturas de los manuales (base de DESARROLLO).
// preparar() los carga y restaurar() deja todo como estaba (datos de ejemplo del seed).
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { clienteAdmin } from "../../tests/db/ayudante";
import { aEmailInterno, contrasenaInterna } from "../../lib/admin/usuario";

const admin = clienteAdmin();
// Los productos de ejemplo (supabase/seed.sql) tienen ids 5eed0000-0000-4000-8000-…
const DESDE = "5eed0000-0000-4000-8000-000000000000";
const HASTA = "5eed0000-0000-4000-8000-ffffffffffff";
export const CONTRASENA = "Lehonor-manual-2026";
export const USUARIOS = { encargado: "laura", vendedor: "martin", otro: "sofia" } as const;

const DESCRIPCIONES: Record<string, string> = {
  "Rutini Malbec":
    "Malbec del Valle de Uco con doce meses en barricas de roble francés. Aromas a ciruela madura, violetas y un toque de vainilla; en boca es amplio, de taninos suaves y final largo.",
  "Salentein Primus Malbec":
    "De viñedos en altura de San Pablo, Tupungato. Intenso y elegante, con frutos negros, especias y notas minerales. Ideal para carnes a la parrilla.",
  "Costa & Pampa Sauvignon Blanc":
    "Blanco fresco de Chapadmalal, a pocos kilómetros del mar. Cítricos, hierbas y una acidez vibrante.",
  "Glenmorangie Original": "Single malt de las Highlands, madurado diez años en barricas de bourbon. Suave, con notas de durazno, vainilla y miel.",
};
const COLORES: Record<string, [string, string]> = {
  "Rutini Malbec": ["#3B1F2B", "#E9DFC8"],
  "Salentein Primus Malbec": ["#1F2A24", "#D9C9A3"],
  "Costa & Pampa Sauvignon Blanc": ["#B9C49A", "#F4F0E2"],
  "Glenmorangie Original": ["#C98A2E", "#F2E6CC"],
  "Zuccardi Q Malbec": ["#2A1A1F", "#EDE3CF"],
};

/** Ilustración de una botella con etiqueta, sobre fondo claro. */
async function botella(nombre: string, [vidrio, etiqueta]: [string, string]) {
  const lineas = nombre.split(" ").reduce<string[]>((ls, p) => {
    const ultima = ls[ls.length - 1];
    if (ultima && (ultima + " " + p).length <= 12) ls[ls.length - 1] = ultima + " " + p;
    else ls.push(p);
    return ls;
  }, []);
  const texto = lineas
    .slice(0, 3)
    .map((l, i) => `<text x="300" y="${560 + i * 34}" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#1B1A17">${l.replace(/&/g, "&amp;")}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900">
    <rect width="600" height="900" fill="#EFE9DC"/>
    <ellipse cx="300" cy="860" rx="150" ry="16" fill="#00000018"/>
    <path d="M265 60 h70 v170 q0 40 45 85 q40 40 40 110 v395 q0 30 -30 30 h-180 q-30 0 -30 -30 v-395 q0 -70 40 -110 q45 -45 45 -85 z" fill="${vidrio}"/>
    <rect x="262" y="52" width="76" height="40" rx="6" fill="#7A6428"/>
    <rect x="185" y="480" width="230" height="200" rx="6" fill="${etiqueta}"/>
    <rect x="200" y="495" width="200" height="2" fill="#B19750"/>
    ${texto}
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}

/** Imagen de promoción (formato apaisado, como las del carrusel). */
async function promo(titulo: string, detalle: string, fondo: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <rect width="1200" height="800" fill="${fondo}"/>
    <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#B19750" stroke-width="3"/>
    <text x="600" y="360" text-anchor="middle" font-family="Georgia, serif" font-size="96" fill="#F6F2E9">${titulo}</text>
    <text x="600" y="460" text-anchor="middle" font-family="Helvetica, sans-serif" font-size="44" fill="#E3D6B4">${detalle}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}

async function crearUsuario(nombre: string, rol: "encargado" | "vendedor") {
  const email = aEmailInterno(nombre);
  const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const previo = lista.users.find((u) => u.email === email);
  if (previo) await admin.auth.admin.deleteUser(previo.id);
  const { data, error } = await admin.auth.admin.createUser({ email, password: contrasenaInterna(CONTRASENA), email_confirm: true });
  if (error) throw error;
  const alta = await admin.from("personal").insert({ user_id: data.user.id, rol });
  if (alta.error) throw alta.error;
  return data.user.id;
}

const subidos: { bucket: string; ruta: string }[] = [];
async function subir(bucket: string, ruta: string, datos: Buffer) {
  const { error } = await admin.storage.from(bucket).upload(ruta, datos, { contentType: "image/webp" });
  if (error) throw error;
  subidos.push({ bucket, ruta });
}

export async function preparar() {
  // Por si una corrida anterior se cortó antes de restaurar.
  await restaurar();
  await crearUsuario(USUARIOS.encargado, "encargado");
  const vendedor = await crearUsuario(USUARIOS.vendedor, "vendedor");
  await crearUsuario(USUARIOS.otro, "vendedor");

  const { data: productos } = await admin.from("productos").select("id, nombre").gte("id", DESDE).lte("id", HASTA);
  const id = (nombre: string) => productos!.find((p) => p.nombre === nombre)!.id as string;

  for (const [nombre, colores] of Object.entries(COLORES)) {
    if (nombre === "Zuccardi Q Malbec") continue; // queda sin foto: la sugiere la IA
    const ruta = `productos/${id(nombre)}/${randomUUID()}.webp`;
    await subir("fotos", ruta, await botella(nombre, colores));
    await admin.from("productos").update({ foto_path: ruta, descripcion: DESCRIPCIONES[nombre] ?? null }).eq("id", id(nombre));
  }

  for (const [i, [t, d, f]] of [
    ["Semana del Malbec", "15 % off en toda la cava", "#3B1F2B"],
    ["Degustación", "Sábados de 18 a 21 h", "#1F2A24"],
  ].entries()) {
    const ruta = `promos/${randomUUID()}.webp`;
    await subir("promociones", ruta, await promo(t, d, f));
    await admin.from("promociones").insert({ imagen_path: ruta, orden: i + 1, visible: true });
  }

  await admin.from("marca").update({ bienvenida: "Bienvenidos a la cava de Lehonor. Pedinos una recomendación." }).eq("id", 1);
  await admin.from("ajustes_ia").update({ activa: true }).eq("id", 1);

  // Una sugerencia lista para revisar.
  const zuccardi = id("Zuccardi Q Malbec");
  const fotoSugerida = `${zuccardi}/${randomUUID()}.webp`;
  await subir("sugerencias", fotoSugerida, await botella("Zuccardi Q Malbec", COLORES["Zuccardi Q Malbec"]));
  await admin.from("sugerencias").insert({
    producto_id: zuccardi,
    estado: "lista",
    descripcion:
      "Malbec de Zuccardi elaborado con uvas del Valle de Uco. Fruta roja y negra, notas florales y especiadas, con una crianza que aporta estructura sin tapar la fruta.",
    foto_path: fotoSugerida,
    foto_sitio: "zuccardiwines.com",
    foto_url_origen: "https://www.zuccardiwines.com/vinos/q-malbec",
    fuentes: [
      { titulo: "Zuccardi Q Malbec – Zuccardi Valle de Uco", url: "https://www.zuccardiwines.com/vinos/q-malbec" },
      { titulo: "Ficha técnica Q Malbec", url: "https://www.zuccardiwines.com/fichas/q-malbec.pdf" },
    ],
    pedida_por: vendedor,
    procesada_en: new Date().toISOString(),
    tokens_entrada: 14000,
    tokens_salida: 1800,
    busquedas: 3,
    costo_usd: 0.05,
  });
}

export async function restaurar() {
  await admin.from("sugerencias").delete().gte("producto_id", DESDE).lte("producto_id", HASTA);
  await admin.from("promociones").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("productos").update({ foto_path: null, descripcion: null }).gte("id", DESDE).lte("id", HASTA);
  await admin.from("marca").update({ bienvenida: null, logo_path: null }).eq("id", 1);
  await admin.from("ajustes_ia").update({ activa: false }).eq("id", 1);
  const porBucket = new Map<string, string[]>();
  for (const s of subidos) porBucket.set(s.bucket, [...(porBucket.get(s.bucket) ?? []), s.ruta]);
  for (const [bucket, rutas] of porBucket) await admin.storage.from(bucket).remove(rutas);
  const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const nombre of Object.values(USUARIOS)) {
    const u = lista.users.find((x) => x.email === aEmailInterno(nombre));
    if (u) {
      await admin.from("importaciones").delete().eq("creada_por", u.id);
      await admin.from("personal").delete().eq("user_id", u.id);
      await admin.auth.admin.deleteUser(u.id);
    }
  }
}
