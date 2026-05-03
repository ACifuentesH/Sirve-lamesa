export interface Ingrediente {
  id: number;
  nombre: string;
  imagen: string;
  categoria: string;
  unidad: string;
  porcionDefault: number;
}

export interface PersonajeSintetico {
  id: number;
  tipo: string;
  edad_rango: string;
  sexo: string;
  imagen: string;
  nombre: string;
  imc_representado?: string;
  estado?: "pendiente" | "en_curso" | "servido";
}

export interface ComponenteServido {
  componente_id: number;
  nombre: string;
  cantidad_gramos: number;
  imagen?: string;
  unidad?: string;
}

export interface Participante {
  pk_participante: number;
  edad: number;
  sexo: string;
  peso_kg: number;
  altura_cm: number;
  imc?: number;
}

export interface Sesion {
  pk_sesion: number;
  fk_participante: number;
  fecha_inicio: string;
  fecha_fin?: string;
  estado: "en_curso" | "completada" | "abandonada";
}

export interface IngredienteEnPlato {
  ingrediente: Ingrediente;
  cantidad: number;
  unidad: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface DecisionPayload {
  sesion_id: number;
  escenario: "desayuno" | "almuerzo" | "cena";
  personaje_tipo: string;
  personaje_edad_rango: string;
  personaje_sexo: string;
  personaje_imc_representado?: string | null;
  personaje_id?: number;
  componentes_servidos: ComponenteServido[];
  tiempo_decision_ms: number;
  orden_servicio: number;
}
