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

/** Centro de cada cuadrante, en % del lado del contenedor. */
const CENTROS: Record<Cuadrante, { x: number; y: number }> = {
  SI: { x: 32, y: 32 },
  SD: { x: 68, y: 32 },
  II: { x: 32, y: 68 },
  ID: { x: 68, y: 68 }
};

const DIAMETRO_NOMINAL_PX = 420;
const OFFSET_PORCION_PX = 15;

/** Los 15 px del documento, en % del diámetro nominal del plato. */
export const OFFSET_PORCION_PCT = (OFFSET_PORCION_PX / DIAMETRO_NOMINAL_PX) * 100;

/**
 * Desplazamientos de los alimentos que comparten cuadrante. Sin esto, dos alimentos
 * distintos en el mismo cuadrante saldrían exactamente encima uno del otro.
 */
const SLOTS: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 6, y: 6 },
  { x: -6, y: 6 },
  { x: 6, y: -6 },
  { x: -6, y: -6 }
];

/**
 * Tamaño visual por clase de alimento, en % del lado del plato.
 *
 * El mapa anterior estaba indexado por los nombres del catálogo viejo ('Pollo',
 * 'Bistecs'), que no existen en las matrices del Anexo B, así que no se podía
 * reutilizar tal cual. Se conserva su rango (38–55 px sobre un plato de 420) y se
 * indexa por `tipo`, que sí es un dato estable del catálogo nuevo.
 */
const TAMANOS_POR_TIPO: Record<string, number> = {
  proteina: 12.5,
  carbohidrato: 11.5,
  lacteo: 10.5,
  vegetal: 10.5,
  fruta: 10.0
};

const TAMANO_POR_DEFECTO = 11.0;

export function tamanoVisualPct(tipo: string): number {
  return TAMANOS_POR_TIPO[tipo] ?? TAMANO_POR_DEFECTO;
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
 * Elige el cuadrante libre, o el que menos elementos tenga. Servir 4 alimentos
 * distintos coloca uno en cada cuadrante, que es el criterio de aceptación de B7.
 */
export function elegirCuadrante(items: ItemPlato[]): Cuadrante {
  const conteo = ocupacion(items);
  return CUADRANTES.reduce(
    (mejor, actual) => (conteo[actual] < conteo[mejor] ? actual : mejor),
    CUADRANTES[0]
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

/**
 * Una posición por porción servida. Las porciones del mismo alimento se escalonan en
 * diagonal a 15 px, "emulando comida contigua en un plato real" (§5.1).
 */
export function posicionesDeItem(item: ItemPlato, tamano: number): { x: number; y: number }[] {
  const centro = CENTROS[item.cuadrante];
  const slot = SLOTS[item.offset_index % SLOTS.length];
  const anillo = Math.floor(item.offset_index / SLOTS.length) * 4;

  const baseX = centro.x + slot.x + (slot.x >= 0 ? anillo : -anillo);
  const baseY = centro.y + slot.y + (slot.y >= 0 ? anillo : -anillo);

  const posiciones: { x: number; y: number }[] = [];
  for (let porcion = 0; porcion < item.porciones; porcion++) {
    const desplazamiento = porcion * OFFSET_PORCION_PCT;
    posiciones.push(recortarAlPlato(baseX + desplazamiento, baseY + desplazamiento, tamano));
  }
  return posiciones;
}
