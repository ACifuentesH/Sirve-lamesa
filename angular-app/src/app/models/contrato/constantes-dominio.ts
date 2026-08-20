// Constantes de dominio compartidas (issue #32).
//
// Antes de este archivo, `TIPOS` (research-export.ts) y `CATS` (admin.component.ts)
// declaraban la misma lista de tipos de alimento por separado, y `MOMENTOS` se repetía
// en admin.component.ts y asignacion.service.ts. Divergir entre esas copias no rompía
// nada: el panel y el CSV simplemente agregarían sobre conjuntos distintos, sin que
// ninguna prueba lo notara. Esta es ahora la única fuente.
//
// Los valores literales son los que ya viajan en los datos (migración 006 para tipos
// de alimento, la CHECK de `momento_dia` para momentos) y no cambian aquí: solo se
// centralizan, en el mismo orden y con el mismo contenido de antes. Los nombres de
// identificador siguen el glosario de CONTEXT.md ("Tipo", no "categoría"; "Momento
// del día", no "escenario"); las etiquetas de UI se arman donde ya vivían
// (CAT_LABEL en admin.component.ts), este archivo no las duplica.

import { MomentoDia } from './personaje.model';

/**
 * Tipos de alimento que alimentan los agregados del panel y del CSV (migración 006).
 * `bebida` es un tipo válido en el catálogo pero no aparece aquí: la bebida nunca va
 * en el plato, se registra aparte (total_bebida_ml), y así ha sido siempre en estos
 * agregados — no es una omisión de este cambio.
 */
export const TIPOS_ALIMENTO = ['proteina', 'carbohidrato', 'vegetal', 'fruta', 'lacteo'] as const;

export type TipoAlimento = (typeof TIPOS_ALIMENTO)[number];

/** Momentos del día del contrato (ver MomentoDia en personaje.model.ts), en el orden en que se muestran. */
export const MOMENTOS_DIA: readonly MomentoDia[] = ['desayuno', 'almuerzo', 'cena'];
