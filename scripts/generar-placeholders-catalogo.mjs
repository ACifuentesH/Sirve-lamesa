/**
 * Genera los 34 marcadores de posición del catálogo de alimentos (issue #15, B2).
 *
 * PROVISIONAL: este script y las imágenes que produce se borran en cuanto lleguen
 * las 34 fotografías reales del Anexo B. Los marcadores existen solo para que la
 * pantalla de servicio se pueda validar de extremo a extremo mientras tanto; no son
 * material de estímulo y el diseño lo grita a propósito (borde discontinuo y la
 * palabra PROVISIONAL sobre cada uno), para que nadie despliegue el experimento con
 * ellos puestos sin darse cuenta.
 *
 * La lista de alimentos NO se escribe aquí: se deriva de
 * `database/seeds/seed_catalogo_alimentos.sql`, que es la única fuente de los slugs
 * y de las rutas de imagen. Así el marcador y el dato no pueden divergir: si el seed
 * cambia un slug, este script cambia con él.
 *
 * Uso (sharp no es dependencia del repo; se instala al vuelo):
 *   npm install --no-save sharp
 *   node scripts/generar-placeholders-catalogo.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEED = join(raiz, 'database/seeds/seed_catalogo_alimentos.sql');
const DESTINO_BASE = join(raiz, 'angular-app/src');
const LADO = 256;

/** Extrae slug, nombre, momento y ruta de imagen de cada INSERT del seed. */
function leerCatalogo() {
  const sql = readFileSync(SEED, 'utf8');
  const fila =
    /\(\s*'([^']+)',\s*'((?:[^']|'')*)',\s*'(desayuno|almuerzo|cena)',\s*'(?:[^']|'')*',\s*'([^']+)',\s*'(?:[^']|'')*',\s*\d+,\s*(?:TRUE|FALSE),\s*'([^']+)',\s*\d+\s*\)/g;

  const alimentos = [];
  for (const m of sql.matchAll(fila)) {
    alimentos.push({
      slug: m[1],
      nombre: m[2].replace(/''/g, "'"),
      momento: m[3],
      tipo: m[4],
      imagen: m[5]
    });
  }
  return alimentos;
}

/** Parte el nombre en líneas que quepan en el cuadro, sin cortar palabras. */
function repartirEnLineas(nombre, maxPorLinea = 16, maxLineas = 3) {
  const lineas = [];
  let actual = '';

  for (const palabra of nombre.split(/\s+/)) {
    const tentativa = actual ? `${actual} ${palabra}` : palabra;
    if (tentativa.length > maxPorLinea && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = tentativa;
    }
  }
  if (actual) lineas.push(actual);

  if (lineas.length > maxLineas) {
    const recorte = lineas.slice(0, maxLineas);
    recorte[maxLineas - 1] = `${recorte[maxLineas - 1].slice(0, maxPorLinea - 1)}…`;
    return recorte;
  }
  return lineas;
}

function escapar(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Silueta gris neutra. Sin color propio: un marcador con color podría sesgar la
 * lectura de la escena tanto como un alimento mal dibujado.
 */
function svgDe(alimento) {
  const lineas = repartirEnLineas(alimento.nombre);
  const alto = lineas.length * 20;
  const primeraY = 126 - alto / 2 + 14;

  const textos = lineas
    .map(
      (linea, i) =>
        `<text x="128" y="${primeraY + i * 20}" text-anchor="middle" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="16" font-weight="600" fill="#4b5563">${escapar(linea)}</text>`
    )
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">
    <rect x="14" y="14" width="228" height="228" rx="26"
          fill="#e5e7eb" fill-opacity="0.85"
          stroke="#9ca3af" stroke-width="3" stroke-dasharray="10 8"/>
    <circle cx="128" cy="72" r="26" fill="#cbd5e1"/>
    ${textos}
    <text x="128" y="212" text-anchor="middle" font-family="Segoe UI, Roboto, Arial, sans-serif"
          font-size="11" font-weight="700" letter-spacing="1.5" fill="#9ca3af">PROVISIONAL</text>
  </svg>`;
}

const { default: sharp } = await import('sharp');

const alimentos = leerCatalogo();
if (alimentos.length !== 34) {
  throw new Error(`El seed devolvió ${alimentos.length} alimentos y el Anexo B fija 34.`);
}

for (const alimento of alimentos) {
  const destino = join(DESTINO_BASE, alimento.imagen);
  mkdirSync(dirname(destino), { recursive: true });

  const webp = await sharp(Buffer.from(svgDe(alimento)))
    .resize(LADO, LADO)
    .webp({ quality: 82, alphaQuality: 100 })
    .toBuffer();

  writeFileSync(destino, webp);
  console.log(`${alimento.momento}/${alimento.slug} → ${webp.length} bytes`);
}

console.log(`\n${alimentos.length} marcadores generados bajo ${DESTINO_BASE}/assets/foods/`);
