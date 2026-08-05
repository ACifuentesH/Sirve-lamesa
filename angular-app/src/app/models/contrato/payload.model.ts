// Contrato Fase 0 (issue #2) — congelado: cambios solo por acuerdo de ambas vías.
// Espejo TypeScript del payload documentado en docs/CONTRATO-DATOS.md.

import { Participante } from './participante.model';
import { MomentoDia, PerfilEdad } from './personaje.model';
import { Cuadrante, EventoClic } from './plato.model';

export interface SesionPayload {
  dispositivo: string;
  navegador: string;          // user-agent
  resolucion_pantalla: string; // '1920x1080'
  fecha_inicio: string;        // ISO 8601 UTC
}

export interface ContextoAsignado {
  personaje_id: number;
  personaje_slug: string;
  personaje_nombre: string;
  personaje_perfil_edad: PerfilEdad;
  personaje_edad_rango: string;
  personaje_genero: 'M' | 'F';
  momento_dia: MomentoDia;
}

export interface Conducta {
  tiempo_decision_segundos: number;  // decimal con un decimal
  secuencia_clics: EventoClic[];     // orden cronológico ascendente
}

export interface AlimentoServido {
  alimento_id: number;
  slug: string;
  nombre: string;
  tipo: string;
  grupo: string;
  porciones: number;          // 1..4
  unidad_display: string;
  peso_unitario_g: number;
  peso_total_g: number;
  cuadrante: Cuadrante;
}

export interface BebidaServida {
  alimento_id: number;
  slug: string;
  nombre: string;
  porciones: number;
  volumen_ml: number;
}

export interface ResultadoPlato {
  alimentos: AlimentoServido[];
  bebida: BebidaServida | null;  // null si no hay; la clave nunca se omite (§5.4)
  total_plato_gramos: number;    // excluye SIEMPRE la bebida
  total_bebida_ml: number;       // 0 si no hay bebida
}

export interface PayloadEnvio {
  participante: Omit<Participante, 'id'>;
  sesion: SesionPayload;
  contexto_asignado: ContextoAsignado;
  conducta: Conducta;
  resultado_plato: ResultadoPlato;
}

/** Respuesta de la RPC en éxito. En fallo, la RPC lanza error con mensaje descriptivo. */
export interface RespuestaEnvio {
  success: true;
  participante_id: number;
  sesion_id: number;
  decision_id: number;
}
