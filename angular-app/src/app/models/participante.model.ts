export interface Participante {
  pk_participante?: number;
  edad: number;
  sexo: string;
  peso_kg: number;
  altura_cm: number;
  imc?: number;
  lugar_nacimiento?: string;
  lugar_residencia?: string;
  ocupacion?: string;
  nivel_socioeconomico?: string;
  eat26_score?: number;
  eat26_data?: any;
  consentimiento_informado: boolean;
  fecha_registro?: string;
  notas?: string;
}

export interface CreateParticipanteDto {
  edad: number;
  sexo: string;
  consentimiento_informado: boolean;
  peso_kg: number;
  altura_cm: number;
  lugar_nacimiento?: string;
  lugar_residencia?: string;
  ocupacion?: string;
  nivel_socioeconomico?: string;
  eat26_score?: number;
  eat26_data?: any;
  notas?: string;
}
