/**
 * Exportación de datos de investigación (equivalente a exportarDatosCompletos + generarCSV del backend).
 * Corre en el navegador tras cargar decisiones + sesiones + participantes + catálogo de componentes.
 */

const CATEGORIAS = ['proteina', 'carbohidrato', 'vegetal', 'fruta', 'salsa'] as const;

export interface ExportRow {
  participante_id: number;
  participante_edad: number | string;
  participante_sexo: string;
  participante_peso_kg: string | number;
  participante_altura_cm: string | number;
  participante_imc: string | number;
  participante_lugar_nacimiento: string;
  participante_lugar_residencia: string;
  participante_ocupacion: string;
  participante_nivel_socioeconomico: string;
  participante_eat26_score: string | number;
  participante_fecha_registro: string;
  sesion_id: number;
  sesion_fecha_inicio: string;
  sesion_fecha_fin: string;
  sesion_duracion_segundos: string | number;
  sesion_estado: string;
  decision_id: number;
  escenario: string;
  personaje_tipo: string;
  personaje_edad_rango: string;
  personaje_sexo: string;
  personaje_imc_representado: string;
  orden_servicio: string | number;
  tiempo_decision_ms: string | number;
  cantidad_total_gramos: string | number;
  timestamp_decision: string;
  proteinas: string;
  carbohidratos: string;
  vegetales: string;
  frutas: string;
  salsas: string;
  otros: string;
}

function buildComponentesMap(componentes: any[]): Record<string, any> {
  const map: Record<string, any> = {};
  for (const comp of componentes) {
    const id = comp.pk_alimento;
    map[id] = comp;
    if (comp.nombre) {
      map[String(comp.nombre).toLowerCase()] = comp;
    }
  }
  return map;
}

export function buildExportRows(
  decisiones: any[],
  sesionesByPk: Map<number, any>,
  participantesByPk: Map<number, any>,
  componentesCatalogo: any[]
): ExportRow[] {
  const componentesMap = buildComponentesMap(componentesCatalogo);

  return decisiones.map((d: any) => {
    const s = sesionesByPk.get(d.fk_sesion);
    const p = s ? participantesByPk.get(s.fk_participante) : null;
    let componentes: any[] = [];
    const raw = d.componentes_servidos;
    if (Array.isArray(raw)) {
      componentes = raw;
    } else if (typeof raw === 'string') {
      try {
        componentes = JSON.parse(raw);
      } catch {
        componentes = [];
      }
    }

    const porCategoria: Record<string, string[]> = {};
    for (const cat of CATEGORIAS) {
      porCategoria[cat] = [];
    }
    porCategoria['otro'] = [];

    for (const comp of componentes) {
      let categoria = 'otro';
      if (comp.componente_id && componentesMap[comp.componente_id]) {
        categoria = componentesMap[comp.componente_id].categoria || 'otro';
      } else if (comp.nombre && componentesMap[String(comp.nombre).toLowerCase()]) {
        categoria = componentesMap[String(comp.nombre).toLowerCase()].categoria || 'otro';
      }
      const unidad = comp.unidad || 'g';
      const cantidad = comp.cantidad_gramos || 0;
      const texto = `${comp.nombre} (${cantidad}${unidad})`;
      if (porCategoria[categoria]) {
        porCategoria[categoria].push(texto);
      } else {
        porCategoria['otro'].push(texto);
      }
    }

    return {
      participante_id: p?.pk_participante ?? 0,
      participante_edad: p?.edad ?? '',
      participante_sexo: p?.sexo ?? '',
      participante_peso_kg: p?.peso_kg ?? '',
      participante_altura_cm: p?.altura_cm ?? '',
      participante_imc: p?.imc ?? '',
      participante_lugar_nacimiento: p?.lugar_nacimiento ?? '',
      participante_lugar_residencia: p?.lugar_residencia ?? '',
      participante_ocupacion: p?.ocupacion ?? '',
      participante_nivel_socioeconomico: p?.nivel_socioeconomico ?? '',
      participante_eat26_score: p?.eat26_score ?? '',
      participante_fecha_registro: p?.fecha_registro ?? '',
      sesion_id: s?.pk_sesion ?? 0,
      sesion_fecha_inicio: s?.fecha_inicio ?? '',
      sesion_fecha_fin: s?.fecha_fin ?? '',
      sesion_duracion_segundos: s?.duracion_total_segundos ?? '',
      sesion_estado: s?.estado ?? '',
      decision_id: d.pk_decision,
      escenario: d.escenario,
      personaje_tipo: d.personaje_tipo,
      personaje_edad_rango: d.personaje_edad_rango ?? '',
      personaje_sexo: d.personaje_sexo ?? '',
      personaje_imc_representado: d.personaje_imc_representado ?? '',
      orden_servicio: d.orden_servicio ?? '',
      tiempo_decision_ms: d.tiempo_decision_ms ?? '',
      cantidad_total_gramos: d.cantidad_total_gramos ?? '',
      timestamp_decision: d.timestamp_decision ?? '',
      proteinas: porCategoria['proteina'].join(', ') || '',
      carbohidratos: porCategoria['carbohidrato'].join(', ') || '',
      vegetales: porCategoria['vegetal'].join(', ') || '',
      frutas: porCategoria['fruta'].join(', ') || '',
      salsas: porCategoria['salsa'].join(', ') || '',
      otros: porCategoria['otro'].join(', ') || ''
    };
  });
}

const ENCABEZADOS: Record<keyof ExportRow, string> = {
  participante_id: 'ID Participante',
  participante_edad: 'Edad Participante',
  participante_sexo: 'Sexo Participante',
  participante_peso_kg: 'Peso (kg)',
  participante_altura_cm: 'Altura (cm)',
  participante_imc: 'IMC',
  participante_lugar_nacimiento: 'Lugar de Nacimiento',
  participante_lugar_residencia: 'Lugar de Residencia',
  participante_ocupacion: 'Ocupación',
  participante_nivel_socioeconomico: 'Nivel Socioeconómico',
  participante_eat26_score: 'EAT-26 Score',
  participante_fecha_registro: 'Fecha Registro Participante',
  sesion_id: 'ID Sesión',
  sesion_fecha_inicio: 'Fecha Inicio Sesión',
  sesion_fecha_fin: 'Fecha Fin Sesión',
  sesion_duracion_segundos: 'Duración Sesión (seg)',
  sesion_estado: 'Estado Sesión',
  decision_id: 'ID Decisión',
  escenario: 'Escenario',
  personaje_tipo: 'Tipo Personaje (Sujeto Servido)',
  personaje_edad_rango: 'Rango Edad Personaje',
  personaje_sexo: 'Sexo Personaje',
  personaje_imc_representado: 'Figura IMC personaje (normopeso/sobrepeso/no_aplica)',
  orden_servicio: 'Orden de Servicio',
  tiempo_decision_ms: 'Tiempo Decisión (ms)',
  cantidad_total_gramos: 'Cantidad Total (g)',
  timestamp_decision: 'Timestamp Decisión',
  proteinas: 'Proteínas',
  carbohidratos: 'Carbohidratos',
  vegetales: 'Vegetales',
  frutas: 'Frutas',
  salsas: 'Salsas/Aderezos',
  otros: 'Otros'
};

export function generarCSV(datos: ExportRow[]): string {
  if (!datos?.length) {
    return '';
  }
  const campos = Object.keys(ENCABEZADOS) as (keyof ExportRow)[];
  let csv = '\uFEFF';
  csv += campos.map(c => `"${ENCABEZADOS[c]}"`).join(',') + '\n';
  for (const fila of datos) {
    const valores = campos.map(campo => {
      let valor =
        fila[campo] !== undefined && fila[campo] !== null ? String(fila[campo]) : '';
      valor = valor.replace(/"/g, '""');
      return `"${valor}"`;
    });
    csv += valores.join(',') + '\n';
  }
  return csv;
}
