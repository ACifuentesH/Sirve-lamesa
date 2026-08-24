/**
 * Concordancia del banner de contextualización (Vía B, tarea B3; §3 del documento).
 *
 * El documento deja la plantilla con "el/la" y "él/ella" sin resolver. Concatenar a
 * ciegas produce "servirle el cena a María ... adecuadas para él", y el banner es el
 * único sitio donde el participante lee a quién sirve: un error ahí contamina la
 * tarea. Por eso son funciones puras, aisladas y verificables.
 */
import { MomentoDia, Personaje } from '../models/contrato';

/** 'la' solo para cena; desayuno y almuerzo son masculinos. */
const ARTICULOS: Record<MomentoDia, string> = {
  desayuno: 'el',
  almuerzo: 'el',
  cena: 'la'
};

export function articuloDe(momento: MomentoDia): string {
  return ARTICULOS[momento];
}

/**
 * El pronombre viene del dato del personaje y no se deduce del nombre: 'ella' para
 * María, 'él' para Juan. Deducirlo del nombre fallaría con cualquier nombre nuevo.
 */
export function pronombreDe(personaje: Personaje): string {
  return personaje.pronombre;
}

/**
 * Segmentos del banner, separados para que la plantilla ponga en negrita las tres
 * variables sin partir la frase con interpolaciones sueltas.
 */
export interface TextoContexto {
  encabezado: string;
  antesMomento: string;
  momento: string;
  antesNombre: string;
  nombre: string;
  perfil: string;
  cierre: string;
}

export function construirTextoContexto(personaje: Personaje, momento: MomentoDia): TextoContexto {
  return {
    encabezado: 'Asignación actual:',
    antesMomento: `Vas a servirle ${articuloDe(momento)}`,
    momento,
    antesNombre: 'a',
    nombre: personaje.nombre,
    perfil: personaje.perfil_edad,
    cierre: `Por favor, selecciona y distribuye en el plato las porciones que consideres adecuadas para ${pronombreDe(personaje)}.`
  };
}
