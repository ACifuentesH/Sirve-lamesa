/**
 * Reparto de alimentos en los 4 cuadrantes del plato (Vía B, tarea B7).
 *
 * Sustituye al algoritmo anterior, que soltaba todo en el centro y luego probaba 150
 * posiciones al azar: la §5.1 del documento lo señala como el defecto más visible,
 * porque cada alimento tapaba al anterior.
 *
 * Todo aquí es función pura de la lista de items, y el desempate entre cuadrantes
 * igual de ocupados sigue un orden fijo. Eso hace la disposición reproducible: la
 * misma secuencia de clics dibuja el mismo plato, que es lo que permite auditar una
 * sesión a partir de `secuencia_clics`.
 *
 * Las coordenadas van en porcentaje del contenedor, no en píxeles, para que el plato
 * escale con el viewport. El offset de 15 px que pide el documento se expresa contra
 * un diámetro nominal y se convierte a porcentaje una sola vez.
 */
import { Cuadrante, ItemPlato } from '../models/contrato';

/** El orden es el desempate: a igualdad de ocupación gana el primero de la lista. */
export const CUADRANTES: readonly Cuadrante[] = ['SI', 'SD', 'II', 'ID'] as const;

/**
 * Ángulo del centro de cada cuadrante (y crece hacia abajo).
 * SI arriba-izquierda, SD arriba-derecha, II abajo-izquierda, ID abajo-derecha.
 */
const ANGULO_CUADRANTE: Record<Cuadrante, number> = {
  SI: (225 * Math.PI) / 180,
  SD: (315 * Math.PI) / 180,
  II: (135 * Math.PI) / 180,
  ID: (45 * Math.PI) / 180
};

const DIAMETRO_NOMINAL_PX = 420;
const OFFSET_PORCION_PX = 15;

/** Los 15 px del documento, en % del diámetro nominal del plato. */
export const OFFSET_PORCION_PCT = (OFFSET_PORCION_PX / DIAMETRO_NOMINAL_PX) * 100;

/**
 * Comida servida en recipiente propio. Va siempre encima del resto y no se le
 * gira casi: un tazón ladeado deja de leerse como tazón.
 */
const RECIPIENTES = new Set([
  'sopa-verduras',
  'yogur',
  'cereal-hojuelas'
]);

export function esRecipiente(slug: string): boolean {
  return RECIPIENTES.has(slug);
}

/**
 * Tamaño visual por alimento, en % del lado del plato.
 *
 * El tipo es el respaldo; el slug manda porque un filete y un huevo no ocupan
 * el mismo espacio aunque ambos sean proteína.
 */
const TAMANOS_POR_SLUG: Record<string, number> = {
  'pechuga-pollo': 42,
  'carne-res': 42,
  'pescado': 40,
  'pollo-desmechado': 36,
  atun: 30,
  jamon: 28,
  huevo: 28,
  'huevo-cocido': 28,
  'granos-legumbres': 34,
  'pan-tostado': 38,
  'pan-integral': 38,
  'arepa-tortilla-maiz': 40,
  'arepa-pequena': 36,
  'galletas-soda': 36,
  'galletas-maiz-arroz': 34,
  arroz: 36,
  pasta: 38,
  papa: 36,
  'platano-maduro': 34,
  'cereal-hojuelas': 38,
  queso: 28,
  'ricotta-cuajada': 30,
  yogur: 34,
  'ensalada-fresca': 38,
  'vegetales-vapor': 36,
  'tomate-aguacate': 34,
  'fruta-rodajas': 34,
  'sopa-verduras': 40
};

const TAMANOS_POR_TIPO: Record<string, number> = {
  proteina: 38,
  carbohidrato: 36,
  lacteo: 30,
  vegetal: 36,
  fruta: 34
};

const TAMANO_POR_DEFECTO = 34;

export function tamanoVisualPct(slug: string, tipo = ''): number {
  return TAMANOS_POR_SLUG[slug] ?? TAMANOS_POR_TIPO[tipo] ?? TAMANO_POR_DEFECTO;
}

/** Cuántos alimentos distintos hay ya en cada cuadrante. */
function ocupacion(items: ItemPlato[]): Record<Cuadrante, number> {
  const conteo: Record<Cuadrante, number> = { SI: 0, SD: 0, II: 0, ID: 0 };
  for (const item of items) {
    conteo[item.cuadrante]++;
  }
  return conteo;
}

/**
 * Elige el cuadrante libre, o el que menos elementos tenga. La comida suelta
 * evita el cuadrante de un tazón si hay otro libre: no se sirve encima del bowl.
 */
export function elegirCuadrante(items: ItemPlato[], slugNuevo = ''): Cuadrante {
  const conteo = ocupacion(items);
  const ocupadosPorRecipiente = new Set(
    items.filter(item => esRecipiente(item.slug)).map(item => item.cuadrante)
  );

  const pool =
    slugNuevo && !esRecipiente(slugNuevo)
      ? CUADRANTES.filter(c => !ocupadosPorRecipiente.has(c))
      : CUADRANTES;
  const candidatos = pool.length > 0 ? pool : CUADRANTES;

  return candidatos.reduce(
    (mejor, actual) => (conteo[actual] < conteo[mejor] ? actual : mejor),
    candidatos[0]
  );
}

/** Posición del alimento dentro de su cuadrante: cuántos había antes que él. */
export function slotEnCuadrante(items: ItemPlato[], cuadrante: Cuadrante): number {
  return items.filter(item => item.cuadrante === cuadrante).length;
}

/**
 * Recorta un punto para que el elemento entero quepa en el círculo. Con 8 alimentos y
 * 4 porciones cada uno, el caso extremo de B7, los offsets acumulados se saldrían del
 * plato sin esto.
 */
function recortarAlPlato(x: number, y: number, tamano: number): { x: number; y: number } {
  const radioMaximo = 50 - tamano / 2;
  const dx = x - 50;
  const dy = y - 50;
  const distancia = Math.hypot(dx, dy);

  if (distancia <= radioMaximo || distancia === 0) {
    return { x, y };
  }

  const factor = radioMaximo / distancia;
  return { x: 50 + dx * factor, y: 50 + dy * factor };
}

/** Empuje leve y fijo por alimento, para que cuatro raciones no dibujen un 2×2. */
function empujeNatural(item: ItemPlato): { x: number; y: number } {
  if (esRecipiente(item.slug)) {
    return { x: 0, y: 0 };
  }
  const n = item.alimento_id * 11 + item.offset_index * 17;
  return {
    x: (n % 9) - 4,
    y: ((n * 3) % 9) - 4
  };
}

export interface OcupantePlato {
  x: number;
  y: number;
  tamano: number;
  slug: string;
  recipiente: boolean;
}

function distanciaMinima(tamano: number, vecino: OcupantePlato, slug: string): number {
  const hueco = vecino.recipiente || esRecipiente(slug) ? 0.82 : 0.74;
  return ((tamano + vecino.tamano) / 2) * hueco;
}

function radioDeServicio(tamano: number, anillo: number): number {
  const exterior = Math.max(14, 50 - tamano / 2 - 3);
  return Math.max(12, exterior * (anillo === 0 ? 1 : 0.62));
}

function puntoEnAnillo(angulo: number, radio: number): { x: number; y: number } {
  return {
    x: 50 + radio * Math.cos(angulo),
    y: 50 + radio * Math.sin(angulo)
  };
}

function estaEnCuadrante(x: number, y: number, cuadrante: Cuadrante): boolean {
  const izquierda = x < 50;
  const arriba = y < 50;
  if (cuadrante === 'SI') {
    return izquierda && arriba;
  }
  if (cuadrante === 'SD') {
    return !izquierda && arriba;
  }
  if (cuadrante === 'II') {
    return izquierda && !arriba;
  }
  return !izquierda && !arriba;
}

function holguraMinima(
  punto: { x: number; y: number },
  tamano: number,
  slug: string,
  ocupados: readonly OcupantePlato[]
): number {
  if (ocupados.length === 0) {
    return 100;
  }
  let minima = Infinity;
  for (const vecino of ocupados) {
    const distancia = Math.hypot(punto.x - vecino.x, punto.y - vecino.y);
    minima = Math.min(minima, distancia - distanciaMinima(tamano, vecino, slug));
  }
  return minima;
}

function candidatosDeServicio(tamano: number): { x: number; y: number }[] {
  const puntos: { x: number; y: number }[] = [];
  const muestras = 16;
  for (let anillo = 0; anillo < 2; anillo++) {
    const radio = radioDeServicio(tamano, anillo);
    const desfase = anillo * 0.18;
    for (let i = 0; i < muestras; i++) {
      const angulo = ((i + desfase) / muestras) * Math.PI * 2;
      puntos.push(puntoEnAnillo(angulo, radio));
    }
  }
  return puntos;
}

/**
 * Elige el hueco más despejado. El cuadrante asignado solo desempata:
 * si hay espacio libre en otro lado, se usa ese en vez de apilar.
 */
function elegirHueco(
  item: ItemPlato,
  tamano: number,
  ocupados: readonly OcupantePlato[],
  indicePorcion: number
): { x: number; y: number } {
  const empuje = empujeNatural({ ...item, offset_index: item.offset_index + indicePorcion });
  const slug = item.slug;
  const cuadrante = item.cuadrante;

  const evaluar = (punto: { x: number; y: number }) => {
    const recortado = recortarAlPlato(punto.x + empuje.x * 0.25, punto.y + empuje.y * 0.25, tamano);
    return { punto: recortado, holgura: holguraMinima(recortado, tamano, slug, ocupados) };
  };

  const hogar = evaluar(puntoEnAnillo(ANGULO_CUADRANTE[cuadrante], radioDeServicio(tamano, 0)));
  const candidatos = [hogar, ...candidatosDeServicio(tamano).map(evaluar)];
  const bonusCuadrante = 2;

  return candidatos.reduce((mejor, actual) => {
    const scoreActual =
      actual.holgura + (estaEnCuadrante(actual.punto.x, actual.punto.y, cuadrante) ? bonusCuadrante : 0);
    const scoreMejor =
      mejor.holgura + (estaEnCuadrante(mejor.punto.x, mejor.punto.y, cuadrante) ? bonusCuadrante : 0);
    return scoreActual > scoreMejor ? actual : mejor;
  }).punto;
}

/**
 * Aleja un punto de las raciones ya servidas, incluida otra porción del mismo
 * alimento: no se ignora el slug, porque apilar con hueco libre se ve mal.
 */
function separarDeVecinos(
  punto: { x: number; y: number },
  tamano: number,
  slug: string,
  ocupados: readonly OcupantePlato[]
): { x: number; y: number } {
  let { x, y } = punto;

  for (let pasada = 0; pasada < 10; pasada++) {
    let movio = false;
    for (const vecino of ocupados) {
      const dx = x - vecino.x;
      const dy = y - vecino.y;
      const distancia = Math.hypot(dx, dy);
      const minima = distanciaMinima(tamano, vecino, slug);

      if (distancia >= minima) {
        continue;
      }

      movio = true;
      if (distancia < 0.001) {
        const n = slug.length * 13 + pasada * 7;
        const angulo = ((n % 12) / 12) * Math.PI * 2;
        x += Math.cos(angulo) * minima;
        y += Math.sin(angulo) * minima;
      } else {
        const empuje = (minima - distancia) / distancia;
        x += dx * empuje;
        y += dy * empuje;
      }
    }

    const recorte = recortarAlPlato(x, y, tamano);
    x = recorte.x;
    y = recorte.y;
    if (!movio) {
      break;
    }
  }

  return recortarAlPlato(x, y, tamano);
}

/**
 * Una posición por porción. Cada ración busca espacio libre en el plato;
 * solo se acerca a otra si ya no queda hueco.
 */
export function posicionesDeItem(
  item: ItemPlato,
  tamano: number,
  ocupados: readonly OcupantePlato[] = []
): { x: number; y: number }[] {
  const posiciones: { x: number; y: number }[] = [];
  const vistos: OcupantePlato[] = ocupados.slice();
  const recipiente = esRecipiente(item.slug);

  for (let porcion = 0; porcion < item.porciones; porcion++) {
    const hueco = elegirHueco(item, tamano, vistos, porcion);
    const punto = separarDeVecinos(hueco, tamano, item.slug, vistos);
    posiciones.push(punto);
    vistos.push({ x: punto.x, y: punto.y, tamano, slug: item.slug, recipiente });
  }

  return posiciones;
}

/** Giro leve y fijo por porción. Los tazones casi no rotan. */
export function rotacionDePorcion(item: ItemPlato, indicePorcion: number): number {
  const n = item.alimento_id * 7 + item.offset_index * 13 + indicePorcion * 19;
  if (esRecipiente(item.slug)) {
    return (n % 7) - 3;
  }
  const grados = (n % 37) - 18;
  return grados === 0 ? 9 : grados;
}
