// Contrato Fase 0 (issue #2) — congelado: cambios solo por acuerdo de ambas vías.

import { MomentoDia } from './personaje.model';

export interface AlimentoCatalogo {
  id: number;
  slug: string;              // 'pan-tostado'
  nombre: string;            // 'Pan Tostado'
  momento_dia: MomentoDia;
  grupo: string;             // rótulo de pestaña: 'Carbohidratos y Acompañamientos'
  tipo: string;              // clase de análisis: 'carbohidrato' — alimenta los agregados del export
  unidad_display: string;    // '1 rebanada' — lo único que ve el participante
  peso_gramos: number;       // 30 — jamás se muestra en la UI
  es_bebida: boolean;
  imagen: string;            // 'assets/foods/desayuno/pan-tostado.webp'
  orden: number;
}
