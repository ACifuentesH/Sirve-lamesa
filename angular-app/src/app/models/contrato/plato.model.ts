// Contrato Fase 0 (issue #2) — congelado: cambios solo por acuerdo de ambas vías.

export type Cuadrante = 'SI' | 'SD' | 'II' | 'ID';

/** Estado en vivo de un alimento sobre el plato. */
export interface ItemPlato {
  alimento_id: number;
  slug: string;
  porciones: number;          // 1..4
  peso_total_g: number;       // porciones * peso_gramos
  cuadrante: Cuadrante;
  offset_index: number;       // para el desplazamiento de 15 px al apilar
}

/** Un evento del registro conductual (§7.1). */
export interface EventoClic {
  timestamp_ms: number;               // relativo al inicio de la tarea
  alimento_slug: string | null;       // null solo para 'cambio_pestana'
  accion: 'agregar' | 'quitar' | 'cambio_pestana';
  pestana?: string;                   // presente solo en 'cambio_pestana'
}
