/**
 * Exportación de datos de investigación (Vía A, issue #13).
 *
 * Se construye sobre la vista `respuestas_experimento` (migración 007), que ya
 * entrega una fila por decisión con participante, sesión y contexto aplanados. Antes
 * esto pedía cuatro tablas y las cruzaba en el navegador; el cruce ahora lo hace
 * Postgres, que es quien sabe hacerlo.
 *
 * Los gramos por alimento salen del JSONB `componentes_servidos` y no de un catálogo
 * aparte: cada elemento ya viaja con su tipo, su rótulo y su peso, tal como los
 * congeló el contrato (AlimentoServido). Así el export de una respuesta vieja sigue
 * reflejando el catálogo vigente el día en que se recogió.
 */

/** Tipos del catálogo (migración 006). `bebida` no aparece: nunca va en el plato. */
const TIPOS = ['proteina', 'carbohidrato', 'vegetal', 'fruta', 'lacteo'] as const;

type Tipo = (typeof TIPOS)[number];

/** Columnas de la vista respuestas_experimento que consume el export. */
export interface FilaVista {
  decision_id: number;
  participante_id: number;
  participante_edad: number | null;
  participante_peso_kg: number | string | null;
  participante_altura_cm: number | string | null;
  participante_imc: number | string | null;
  participante_genero: string | null;
  participante_nivel_estudios: string | null;
  participante_semestre: string | null;
  participante_etnia: string | null;
  participante_region_origen: string | null;
  participante_region_residencia: string | null;
  personaje_id: number | null;
  personaje_nombre: string | null;
  personaje_perfil_edad: string | null;
  personaje_edad_rango: string | null;
  personaje_genero: string | null;
  momento_dia: string | null;
  tiempo_decision_segundos: number | string | null;
  secuencia_clics: unknown;
  componentes_servidos: unknown;
  total_plato_gramos: number | string | null;
  total_bebida_ml: number | string | null;
  bebida_slug: string | null;
  sesion_id: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  duracion_total_segundos: number | string | null;
  sesion_estado: string | null;
  dispositivo: string | null;
  resolucion_pantalla: string | null;
  timestamp_decision: string | null;
}

export interface ExportRow {
  participante_id: number | string;
  participante_edad: number | string;
  participante_genero: string;
  participante_nivel_estudios: string;
  participante_semestre: string;
  participante_etnia: string;
  participante_region_origen: string;
  participante_region_residencia: string;
  participante_peso_kg: number | string;
  participante_altura_cm: number | string;
  participante_imc: number | string;
  sesion_id: number | string;
  sesion_fecha_inicio: string;
  sesion_fecha_fin: string;
  sesion_duracion_segundos: number | string;
  sesion_estado: string;
  sesion_dispositivo: string;
  sesion_resolucion: string;
  decision_id: number | string;
  momento_dia: string;
  personaje_id: number | string;
  personaje_nombre: string;
  personaje_perfil_edad: string;
  personaje_edad_rango: string;
  personaje_genero: string;
  tiempo_decision_segundos: number | string;
  total_plato_gramos: number | string;
  total_bebida_ml: number | string;
  bebida_slug: string;
  n_alimentos: number | string;
  proteinas: string;
  carbohidratos: string;
  vegetales: string;
  frutas: string;
  lacteos: string;
  otros: string;
  secuencia_clics_json: string;
  timestamp_decision: string;
}

/** Un alimento del JSONB, listo para gráficos del panel. */
export interface AlimentoEnPlato {
  nombre: string;
  tipo: string;
  gramos: number;
}

/**
 * Acepta el contrato nuevo (tipo + peso_total_g) y el JSONB viejo
 * (cantidad_gramos), para que el panel no se caiga con las 47 decisiones
 * recogidas antes de la RPC.
 */
export function parseAlimentos(componentes: unknown): AlimentoEnPlato[] {
  return comoArreglo(componentes).map(item => {
    const tipo = String(item?.tipo || item?.categoria || '').toLowerCase();
    const conocido = (TIPOS as readonly string[]).includes(tipo);
    return {
      nombre: String(item?.nombre || item?.slug || 'sin nombre'),
      tipo: conocido ? tipo : 'otro',
      gramos: Number(item?.peso_total_g ?? item?.cantidad_gramos) || 0
    };
  });
}

/** El JSONB puede llegar como arreglo o como texto según el driver. */
export function comoArreglo(valor: unknown): any[] {
  if (Array.isArray(valor)) {
    return valor;
  }
  if (typeof valor === 'string') {
    try {
      const parseado = JSON.parse(valor);
      return Array.isArray(parseado) ? parseado : [];
    } catch {
      return [];
    }
  }
  return [];
}

function comoTextoJson(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  return typeof valor === 'string' ? valor : JSON.stringify(valor);
}

function texto(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

/**
 * Describe cada alimento con sus porciones y su peso, no solo con el nombre: para el
 * análisis, "Arroz (2 × 1 taza = 300 g)" y "Arroz (1 × 1 taza = 150 g)" son datos
 * distintos, y el rótulo suelto los volvería indistinguibles.
 */
function describirAlimento(item: any): string {
  const nombre = texto(item?.nombre) || texto(item?.slug) || 'sin nombre';
  const porciones = Number(item?.porciones) || 0;
  const unidad = texto(item?.unidad_display);
  const gramos = Number(item?.peso_total_g) || 0;
  const detalleUnidad = unidad ? ` × ${unidad}` : '';
  return `${nombre} (${porciones}${detalleUnidad} = ${gramos} g)`;
}

export function buildExportRows(filas: FilaVista[]): ExportRow[] {
  return (filas || []).map(fila => {
    const alimentos = comoArreglo(fila.componentes_servidos);

    const porTipo: Record<string, string[]> = { otro: [] };
    for (const tipo of TIPOS) {
      porTipo[tipo] = [];
    }

    for (const item of alimentos) {
      const tipo = texto(item?.tipo).toLowerCase();
      const destino = (TIPOS as readonly string[]).includes(tipo) ? (tipo as Tipo) : 'otro';
      porTipo[destino].push(describirAlimento(item));
    }

    return {
      participante_id: fila.participante_id ?? '',
      participante_edad: fila.participante_edad ?? '',
      participante_genero: texto(fila.participante_genero),
      participante_nivel_estudios: texto(fila.participante_nivel_estudios),
      participante_semestre: texto(fila.participante_semestre),
      participante_etnia: texto(fila.participante_etnia),
      participante_region_origen: texto(fila.participante_region_origen),
      participante_region_residencia: texto(fila.participante_region_residencia),
      participante_peso_kg: fila.participante_peso_kg ?? '',
      participante_altura_cm: fila.participante_altura_cm ?? '',
      participante_imc: fila.participante_imc ?? '',
      sesion_id: fila.sesion_id ?? '',
      sesion_fecha_inicio: texto(fila.fecha_inicio),
      sesion_fecha_fin: texto(fila.fecha_fin),
      sesion_duracion_segundos: fila.duracion_total_segundos ?? '',
      sesion_estado: texto(fila.sesion_estado),
      sesion_dispositivo: texto(fila.dispositivo),
      sesion_resolucion: texto(fila.resolucion_pantalla),
      decision_id: fila.decision_id ?? '',
      momento_dia: texto(fila.momento_dia),
      personaje_id: fila.personaje_id ?? '',
      personaje_nombre: texto(fila.personaje_nombre),
      personaje_perfil_edad: texto(fila.personaje_perfil_edad),
      personaje_edad_rango: texto(fila.personaje_edad_rango),
      personaje_genero: texto(fila.personaje_genero),
      tiempo_decision_segundos: fila.tiempo_decision_segundos ?? '',
      total_plato_gramos: fila.total_plato_gramos ?? '',
      total_bebida_ml: fila.total_bebida_ml ?? '',
      bebida_slug: texto(fila.bebida_slug),
      n_alimentos: alimentos.length,
      proteinas: porTipo['proteina'].join(', '),
      carbohidratos: porTipo['carbohidrato'].join(', '),
      vegetales: porTipo['vegetal'].join(', '),
      frutas: porTipo['fruta'].join(', '),
      lacteos: porTipo['lacteo'].join(', '),
      otros: porTipo['otro'].join(', '),
      secuencia_clics_json: comoTextoJson(fila.secuencia_clics),
      timestamp_decision: texto(fila.timestamp_decision)
    };
  });
}

export const ENCABEZADOS: Record<keyof ExportRow, string> = {
  participante_id: 'ID Participante',
  participante_edad: 'Edad Participante',
  participante_genero: 'Género Participante',
  participante_nivel_estudios: 'Nivel de Estudios',
  participante_semestre: 'Semestre o Año',
  participante_etnia: 'Etnia',
  participante_region_origen: 'Región de Origen',
  participante_region_residencia: 'Región de Residencia',
  participante_peso_kg: 'Peso (kg)',
  participante_altura_cm: 'Altura (cm)',
  participante_imc: 'IMC',
  sesion_id: 'ID Sesión',
  sesion_fecha_inicio: 'Fecha Inicio Sesión',
  sesion_fecha_fin: 'Fecha Fin Sesión',
  sesion_duracion_segundos: 'Duración Sesión (seg)',
  sesion_estado: 'Estado Sesión',
  sesion_dispositivo: 'Dispositivo',
  sesion_resolucion: 'Resolución de Pantalla',
  decision_id: 'ID Decisión',
  momento_dia: 'Momento del Día',
  personaje_id: 'ID Personaje',
  personaje_nombre: 'Personaje Servido',
  personaje_perfil_edad: 'Perfil de Edad del Personaje',
  personaje_edad_rango: 'Rango de Edad del Personaje',
  personaje_genero: 'Género del Personaje',
  tiempo_decision_segundos: 'Tiempo de Decisión (seg)',
  total_plato_gramos: 'Total del Plato (g)',
  total_bebida_ml: 'Total de Bebida (ml)',
  bebida_slug: 'Bebida Servida',
  n_alimentos: 'Nº de Alimentos Servidos',
  proteinas: 'Proteínas',
  carbohidratos: 'Carbohidratos',
  vegetales: 'Vegetales',
  frutas: 'Frutas',
  lacteos: 'Lácteos',
  otros: 'Otros',
  secuencia_clics_json: 'Secuencia de Clics (JSON)',
  timestamp_decision: 'Timestamp Decisión'
};

export function generarCSV(datos: ExportRow[]): string {
  const campos = Object.keys(ENCABEZADOS) as (keyof ExportRow)[];
  // El BOM es lo que hace que Excel abra el archivo como UTF-8 y no rompa los acentos.
  // Se escribe siempre, incluso con un estudio sin datos: un investigador que exporta
  // con la BD en cero debe recibir un CSV valido con encabezados, no un archivo en blanco.
  let csv = '\uFEFF';
  csv += campos.map(c => `"${ENCABEZADOS[c]}"`).join(',') + '\n';
  for (const fila of datos ?? []) {
    const valores = campos.map(campo => {
      const bruto = fila[campo];
      const valor = bruto !== undefined && bruto !== null ? String(bruto) : '';
      return `"${valor.replace(/"/g, '""')}"`;
    });
    csv += valores.join(',') + '\n';
  }
  return csv;
}
