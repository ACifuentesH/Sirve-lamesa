// Contrato Fase 0 (issue #2) — congelado: cambios solo por acuerdo de ambas vías.

export type Genero = 'masculino' | 'femenino' | 'no_binario' | 'prefiero_no_decir';
export type NivelEstudios = 'pregrado_curso' | 'pregrado_completo' | 'posgrado' | 'otro';
export type Etnia = 'latino_hispano' | 'afrodescendiente' | 'indigena' | 'blanco' | 'otro';

export interface Participante {
  id?: number;
  edad: number;
  peso_kg: number;
  altura_cm: number;
  genero: Genero;
  nivel_estudios: NivelEstudios;
  /** Obligatorio solo si nivel_estudios === 'pregrado_curso'. */
  semestre_o_anio: string | null;
  etnia: Etnia;
  region_origen: string;
  region_residencia: string;
  consentimiento_informado: boolean;
}
