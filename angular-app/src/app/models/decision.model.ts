export interface Decision {
  pk_decision?: number;
  fk_sesion?: number;
  sesion_id?: number; // Para compatibilidad
  escenario: 'desayuno' | 'almuerzo' | 'cena';
  personaje_tipo: string;
  personaje_edad_rango: string;
  personaje_sexo: string;
  personaje_imc_representado?: string | null;
  fk_plato?: number;
  plato_id?: number; // Para compatibilidad
  fk_bebida?: number;
  bebida_id?: number; // Para compatibilidad
  componentes_servidos: ComponenteServido[];
  cantidad_total_gramos?: number;
  tiempo_decision_ms: number;
  orden_servicio: number;
  timestamp_decision?: string;
  notas?: string;
}

export interface ComponenteServido {
  componente_id: number;
  nombre: string;
  cantidad_gramos: number;
  imagen?: string;
  unidad?: string;
}

export interface CreateDecisionDto {
  sesion_id: number;
  escenario: 'desayuno' | 'almuerzo' | 'cena';
  personaje_tipo: string;
  personaje_edad_rango: string;
  personaje_sexo: string;
  personaje_imc_representado?: string | null;
  plato_id?: number;
  bebida_id?: number;
  componentes_servidos: ComponenteServido[];
  tiempo_decision_ms: number;
  orden_servicio: number;
  notas?: string;
}

export interface DecisionesBatchDto {
  decisiones: CreateDecisionDto[];
}
