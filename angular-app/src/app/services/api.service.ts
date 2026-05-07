import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { createClient, PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { buildExportRows, generarCSV } from '../utils/research-export';

function pgErr(e: PostgrestError | null): string {
  return e?.message || 'Error de Supabase';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  private decisionInsertPayload(datos: any) {
    let cantidad_total = 0;
    const arr = datos.componentes_servidos;
    if (Array.isArray(arr)) {
      cantidad_total = arr.reduce(
        (sum: number, comp: any) => sum + (parseFloat(comp.cantidad_gramos) || 0),
        0
      );
    }
    const tiempoDecisionMs = Number.isFinite(Number(datos.tiempo_decision_ms))
      ? Math.max(0, Math.round(Number(datos.tiempo_decision_ms)))
      : null;

    return {
      fk_sesion: datos.sesion_id,
      escenario: datos.escenario,
      personaje_tipo: datos.personaje_tipo,
      personaje_edad_rango: datos.personaje_edad_rango,
      personaje_sexo: datos.personaje_sexo,
      personaje_imc_representado: datos.personaje_imc_representado ?? null,
      fk_plato: datos.plato_id ?? null,
      fk_bebida: datos.bebida_id ?? null,
      componentes_servidos: datos.componentes_servidos,
      cantidad_total_gramos: cantidad_total,
      tiempo_decision_ms: tiempoDecisionMs,
      orden_servicio: datos.orden_servicio,
      notas: datos.notas ?? null
    };
  }

  // ===================================
  // PARTICIPANTES
  // ===================================

  crearParticipante(data: any): Observable<any> {
    const imc =
      data.peso_kg && data.altura_cm
        ? Number((data.peso_kg / Math.pow(data.altura_cm / 100, 2)).toFixed(2))
        : null;

    const row: Record<string, unknown> = {
      edad: data.edad,
      sexo: data.sexo,
      peso_kg: data.peso_kg,
      altura_cm: data.altura_cm,
      imc,
      lugar_nacimiento: data.lugar_nacimiento ?? null,
      lugar_residencia: data.lugar_residencia ?? null,
      ocupacion: data.ocupacion ?? null,
      nivel_socioeconomico: data.nivel_socioeconomico ?? null,
      eat26_score: data.eat26_score ?? null,
      eat26_data: data.eat26_data ?? null,
      consentimiento_informado: data.consentimiento_informado ?? false,
      notas: data.notas ?? null
    };

    return from(
      this.client.from('participantes').insert(row).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        return { success: true, data, message: 'Participante creado exitosamente' };
      })
    );
  }

  obtenerParticipante(id: number): Observable<any> {
    return from(
      this.client.from('participantes').select('*').eq('pk_participante', id).maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        if (!data) {
          throw new Error('Participante no encontrado');
        }
        return { success: true, data };
      })
    );
  }

  actualizarParticipante(id: number, data: any): Observable<any> {
    const patch: Record<string, unknown> = {};
    if (data.peso_kg !== undefined) {
      patch.peso_kg = data.peso_kg;
    }
    if (data.altura_cm !== undefined) {
      patch.altura_cm = data.altura_cm;
    }
    if (data.peso_kg !== undefined && data.altura_cm !== undefined) {
      patch.imc = Number((data.peso_kg / Math.pow(data.altura_cm / 100, 2)).toFixed(2));
    }
    if (data.lugar_nacimiento !== undefined) {
      patch.lugar_nacimiento = data.lugar_nacimiento;
    }
    if (data.lugar_residencia !== undefined) {
      patch.lugar_residencia = data.lugar_residencia;
    }
    if (data.ocupacion !== undefined) {
      patch.ocupacion = data.ocupacion;
    }
    if (data.nivel_socioeconomico !== undefined) {
      patch.nivel_socioeconomico = data.nivel_socioeconomico;
    }
    if (data.eat26_score !== undefined) {
      patch.eat26_score = data.eat26_score;
    }
    if (data.eat26_data !== undefined) {
      patch.eat26_data = data.eat26_data;
    }
    if (data.notas !== undefined) {
      patch.notas = data.notas;
    }

    if (Object.keys(patch).length === 0) {
      return throwError(() => new Error('No se proporcionaron campos para actualizar'));
    }

    return from(
      this.client.from('participantes').update(patch).eq('pk_participante', id).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        if (!data) {
          throw new Error('Participante no encontrado');
        }
        return { success: true, data, message: 'Participante actualizado exitosamente' };
      })
    );
  }

  // ===================================
  // SESIONES
  // ===================================

  iniciarSesion(data: any): Observable<any> {
    const row = {
      fk_participante: data.participante_id,
      dispositivo: data.dispositivo ?? null,
      navegador: data.navegador ?? null,
      resolucion_pantalla: data.resolucion_pantalla ?? null
    };

    return from(
      this.client.from('sesiones_juego').insert(row).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        return { success: true, data, message: 'Sesión iniciada exitosamente' };
      })
    );
  }

  finalizarSesion(id: number, data: any): Observable<any> {
    const estado = data.estado || 'completada';
    const patch: Record<string, unknown> = {
      fecha_fin: new Date().toISOString(),
      estado,
      notas: data.notas ?? null
    };

    return from(
      this.client.from('sesiones_juego').update(patch).eq('pk_sesion', id).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        if (!data) {
          throw new Error('Sesión no encontrada');
        }
        return { success: true, data, message: 'Sesión finalizada exitosamente' };
      })
    );
  }

  obtenerSesion(id: number): Observable<any> {
    return from(
      this.client.from('sesiones_juego').select('*').eq('pk_sesion', id).maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        if (!data) {
          throw new Error('Sesión no encontrada');
        }
        return { success: true, data };
      })
    );
  }

  obtenerDecisionesDeSesion(id: number): Observable<any> {
    return this.obtenerSesion(id).pipe(
      switchMap((sesionRes: any) =>
        from(
          this.client
            .from('decisiones_porcionamiento')
            .select('*')
            .eq('fk_sesion', id)
            .order('orden_servicio', { ascending: true })
            .order('timestamp_decision', { ascending: true })
        ).pipe(
          map(({ data: decisiones, error }) => {
            if (error) {
              throw new Error(pgErr(error));
            }
            return {
              success: true,
              data: {
                sesion: sesionRes.data,
                decisiones: decisiones || [],
                total_decisiones: (decisiones || []).length
              }
            };
          })
        )
      )
    );
  }

  // ===================================
  // PERSONAJES
  // ===================================

  obtenerPersonajes(): Observable<any> {
    return from(
      this.client.from('personajes').select('*').order('pk_personaje')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        return { success: true, data: data || [] };
      })
    );
  }

  obtenerPersonaje(id: number): Observable<any> {
    return from(
      this.client.from('personajes').select('*').eq('pk_personaje', id).maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        if (!data) {
          throw new Error('Personaje no encontrado');
        }
        return { success: true, data };
      })
    );
  }

  // ===================================
  // INGREDIENTES
  // ===================================

  obtenerIngredientes(categoria?: string): Observable<any> {
    let q = this.client.from('componentes').select('*').order('categoria').order('nombre');
    if (categoria) {
      q = q.eq('categoria', categoria);
    }
    return from(q).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        return { success: true, data: data || [] };
      })
    );
  }

  obtenerIngrediente(id: number): Observable<any> {
    return from(
      this.client.from('componentes').select('*').eq('pk_alimento', id).maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        if (!data) {
          throw new Error('Ingrediente no encontrado');
        }
        return { success: true, data };
      })
    );
  }

  // ===================================
  // MENÚ
  // ===================================

  obtenerMenus(): Observable<any> {
    return from(this.client.from('menu').select('*').order('nombre')).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        return { success: true, data: data || [], total: (data || []).length };
      })
    );
  }

  obtenerPlatosDeMenu(menuId: number): Observable<any> {
    return from(
      this.client.from('menu_plato').select('fk_plato').eq('fk_menu', menuId)
    ).pipe(
      switchMap(({ data: links, error }) => {
        if (error) {
          return throwError(() => new Error(pgErr(error)));
        }
        const ids = (links || []).map((l: any) => l.fk_plato);
        if (ids.length === 0) {
          return ofMenusPlatos([]);
        }
        return from(
          this.client.from('plato').select('*').in('pk_plato', ids).order('nombre')
        ).pipe(
          map(({ data: platos, error: e2 }) => {
            if (e2) {
              throw new Error(pgErr(e2));
            }
            return { success: true, data: platos || [], total: (platos || []).length };
          })
        );
      })
    );
  }

  obtenerComponentesDePlato(platoId: number): Observable<any> {
    return from(
      this.client.from('porcion').select('fk_alimento, cantidad, unidad_medida').eq('fk_plato', platoId)
    ).pipe(
      switchMap(({ data: porciones, error }) => {
        if (error) {
          return throwError(() => new Error(pgErr(error)));
        }
        const rows = porciones || [];
        if (rows.length === 0) {
          return ofMenusPlatos([]);
        }
        const ids = [...new Set(rows.map((r: any) => r.fk_alimento))];
        return from(
          this.client.from('componentes').select('*').in('pk_alimento', ids)
        ).pipe(
          map(({ data: comps, error: e2 }) => {
            if (e2) {
              throw new Error(pgErr(e2));
            }
            const byId = new Map((comps || []).map((c: any) => [c.pk_alimento, c]));
            const merged = rows.map((r: any) => {
              const c = byId.get(r.fk_alimento) || {};
              return {
                ...c,
                cantidad: r.cantidad,
                unidad_medida: r.unidad_medida
              };
            });
            merged.sort((a: any, b: any) => String(a.nombre).localeCompare(String(b.nombre)));
            return { success: true, data: merged, total: merged.length };
          })
        );
      })
    );
  }

  obtenerBebidas(): Observable<any> {
    return from(this.client.from('bebida').select('*').order('nombre')).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        return { success: true, data: data || [], total: (data || []).length };
      })
    );
  }

  obtenerBebidasDeMenu(menuId: number): Observable<any> {
    return from(
      this.client.from('menu_bebida').select('fk_bebida').eq('fk_menu', menuId)
    ).pipe(
      switchMap(({ data: links, error }) => {
        if (error) {
          return throwError(() => new Error(pgErr(error)));
        }
        const ids = (links || []).map((l: any) => l.fk_bebida);
        if (ids.length === 0) {
          return ofMenusPlatos([]);
        }
        return from(
          this.client.from('bebida').select('*').in('pk_bebida', ids).order('nombre')
        ).pipe(
          map(({ data: bebidas, error: e2 }) => {
            if (e2) {
              throw new Error(pgErr(e2));
            }
            return { success: true, data: bebidas || [], total: (bebidas || []).length };
          })
        );
      })
    );
  }

  // ===================================
  // DECISIONES
  // ===================================

  registrarDecision(data: any): Observable<any> {
    return from(
      this.client
        .from('decisiones_porcionamiento')
        .insert(this.decisionInsertPayload(data))
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(pgErr(error));
        }
        return {
          success: true,
          data,
          message: 'Decisión registrada exitosamente'
        };
      })
    );
  }

  registrarDecisionesBatch(decisiones: any[]): Observable<any> {
    return from(this.runDecisionBatch(decisiones)).pipe(
      map(resultados => ({
        success: true,
        data: resultados,
        total: resultados.length,
        message: `${resultados.length} decisiones registradas exitosamente`
      }))
    );
  }

  private async runDecisionBatch(decisiones: any[]) {
    const resultados: any[] = [];
    for (const d of decisiones) {
      const { data, error } = await this.client
        .from('decisiones_porcionamiento')
        .insert(this.decisionInsertPayload(d))
        .select()
        .single();
      if (error) {
        throw new Error(pgErr(error));
      }
      resultados.push(data);
    }
    return resultados;
  }

  // ===================================
  // ESTADÍSTICAS
  // ===================================

  obtenerEstadisticasGenerales(): Observable<any> {
    return from(this.fetchStatsGenerales()).pipe(
      map(stats => ({ success: true, data: stats }))
    );
  }

  private async fetchStatsGenerales() {
    const [p, s, d, dur] = await Promise.all([
      this.client.from('participantes').select('*', { count: 'exact', head: true }),
      this.client
        .from('sesiones_juego')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'completada'),
      this.client.from('decisiones_porcionamiento').select('*', { count: 'exact', head: true }),
      this.client
        .from('sesiones_juego')
        .select('duracion_total_segundos')
        .not('duracion_total_segundos', 'is', null)
    ]);

    if (p.error) {
      throw new Error(pgErr(p.error));
    }
    if (s.error) {
      throw new Error(pgErr(s.error));
    }
    if (d.error) {
      throw new Error(pgErr(d.error));
    }
    if (dur.error) {
      throw new Error(pgErr(dur.error));
    }

    const durations = (dur.data || [])
      .map((r: any) => Number(r.duracion_total_segundos))
      .filter((n: number) => !Number.isNaN(n));
    const promedio_duracion =
      durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0;

    return {
      total_participantes: p.count ?? 0,
      total_sesiones: s.count ?? 0,
      total_decisiones: d.count ?? 0,
      promedio_duracion
    };
  }

  obtenerEstadisticasPorGenero(): Observable<any> {
    return from(this.estadisticasPorGeneroManual()).pipe(
      map(rows => ({ success: true, data: rows }))
    );
  }

  private async estadisticasPorGeneroManual() {
    const { data, error } = await this.client
      .from('decisiones_porcionamiento')
      .select('personaje_sexo, cantidad_total_gramos')
      .not('personaje_sexo', 'is', null);

    if (error) {
      throw new Error(pgErr(error));
    }
    const map = new Map<
      string,
      { personaje_sexo: string; cantidad_decisiones: number; total_gramos: number; sum_for_avg: number }
    >();
    for (const row of data || []) {
      const sexo = row.personaje_sexo as string;
      const g = parseFloat(String(row.cantidad_total_gramos)) || 0;
      const cur = map.get(sexo) || {
        personaje_sexo: sexo,
        cantidad_decisiones: 0,
        total_gramos: 0,
        sum_for_avg: 0
      };
      cur.cantidad_decisiones++;
      cur.total_gramos += g;
      cur.sum_for_avg += g;
      map.set(sexo, cur);
    }
    return [...map.values()].map(v => ({
      personaje_sexo: v.personaje_sexo,
      cantidad_decisiones: String(v.cantidad_decisiones),
      promedio_gramos: v.cantidad_decisiones ? v.sum_for_avg / v.cantidad_decisiones : 0,
      total_gramos: String(v.total_gramos)
    }));
  }

  obtenerEstadisticasPorEdad(): Observable<any> {
    return from(this.estadisticasPorEdadManual()).pipe(
      map(rows => ({ success: true, data: rows }))
    );
  }

  private async estadisticasPorEdadManual() {
    const { data, error } = await this.client
      .from('decisiones_porcionamiento')
      .select('personaje_edad_rango, cantidad_total_gramos')
      .not('personaje_edad_rango', 'is', null);

    if (error) {
      throw new Error(pgErr(error));
    }
    const map = new Map<
      string,
      { personaje_edad_rango: string; cantidad_decisiones: number; total_gramos: number; sum_for_avg: number }
    >();
    for (const row of data || []) {
      const rango = row.personaje_edad_rango as string;
      const g = parseFloat(String(row.cantidad_total_gramos)) || 0;
      const cur = map.get(rango) || {
        personaje_edad_rango: rango,
        cantidad_decisiones: 0,
        total_gramos: 0,
        sum_for_avg: 0
      };
      cur.cantidad_decisiones++;
      cur.total_gramos += g;
      cur.sum_for_avg += g;
      map.set(rango, cur);
    }
    const rows = [...map.values()]
      .map(v => ({
        personaje_edad_rango: v.personaje_edad_rango,
        cantidad_decisiones: String(v.cantidad_decisiones),
        promedio_gramos: v.cantidad_decisiones ? v.sum_for_avg / v.cantidad_decisiones : 0,
        total_gramos: String(v.total_gramos)
      }))
      .sort((a, b) => String(a.personaje_edad_rango).localeCompare(String(b.personaje_edad_rango)));
    return rows;
  }

  // ===================================
  // ADMIN + EXPORT
  // ===================================

  obtenerDatosAdmin(): Observable<any> {
    return from(this.buildAdminDatos()).pipe(
      map(data => ({ success: true, data }))
    );
  }

  private async buildAdminDatos() {
    const { data: decisionesRaw, error: e1 } = await this.client
      .from('decisiones_porcionamiento')
      .select('*')
      .order('timestamp_decision', { ascending: false });

    if (e1) {
      throw new Error(pgErr(e1));
    }
    const decisiones = decisionesRaw || [];
    const sesionIds = [...new Set(decisiones.map((d: any) => d.fk_sesion))];
    let sesiones: any[] = [];
    if (sesionIds.length) {
      const { data, error } = await this.client
        .from('sesiones_juego')
        .select('*')
        .in('pk_sesion', sesionIds);
      if (error) {
        throw new Error(pgErr(error));
      }
      sesiones = data || [];
    }
    const partIds = [...new Set(sesiones.map((s: any) => s.fk_participante))];
    let participantes: any[] = [];
    if (partIds.length) {
      const { data, error } = await this.client
        .from('participantes')
        .select('*')
        .in('pk_participante', partIds);
      if (error) {
        throw new Error(pgErr(error));
      }
      participantes = data || [];
    }

    const sesByPk = new Map(sesiones.map((s: any) => [s.pk_sesion, s]));
    const partByPk = new Map(participantes.map((p: any) => [p.pk_participante, p]));

    const decisionesMapped = decisiones.map((d: any) => {
      const s = sesByPk.get(d.fk_sesion);
      const p = s ? partByPk.get(s.fk_participante) : null;
      return {
        pk_decision: d.pk_decision,
        escenario: d.escenario,
        personaje_tipo: d.personaje_tipo,
        personaje_edad_rango: d.personaje_edad_rango,
        personaje_sexo: d.personaje_sexo,
        personaje_imc_representado: d.personaje_imc_representado,
        componentes_servidos: d.componentes_servidos,
        cantidad_total_gramos: d.cantidad_total_gramos,
        tiempo_decision_ms: d.tiempo_decision_ms,
        orden_servicio: d.orden_servicio,
        timestamp_decision: d.timestamp_decision,
        participante_id: p?.pk_participante,
        participante_sexo: p?.sexo,
        participante_edad: p?.edad,
        participante_peso_kg: p?.peso_kg,
        participante_altura_cm: p?.altura_cm,
        participante_imc: p?.imc,
        sesion_id: s?.pk_sesion,
        sesion_estado: s?.estado,
        sesion_fecha_inicio: s?.fecha_inicio,
        sesion_duracion_segundos: s?.duracion_total_segundos ?? null,
        tiempo_total_completacion_segundos: s?.duracion_total_segundos ?? null
      };
    });

    const { data: componentes_catalogo, error: e2 } = await this.client
      .from('componentes')
      .select('pk_alimento, nombre, categoria, unidad')
      .order('categoria')
      .order('nombre');

    if (e2) {
      throw new Error(pgErr(e2));
    }

    return {
      decisiones: decisionesMapped,
      componentes_catalogo: componentes_catalogo || []
    };
  }

  /** CSV con BOM UTF-8 (misma lógica que el backend). */
  obtenerExportacionCSV(): Observable<string> {
    return from(this.fetchExportBundle()).pipe(
      map(({ decisiones, sesionesByPk, participantesByPk, componentes }) => {
        const rows = buildExportRows(decisiones, sesionesByPk, participantesByPk, componentes);
        return generarCSV(rows);
      })
    );
  }

  obtenerExportacionJSON(): Observable<{ success: boolean; exportado_en: string; total_registros: number; data: unknown[] }> {
    return from(this.fetchExportBundle()).pipe(
      map(({ decisiones, sesionesByPk, participantesByPk, componentes }) => {
        const data = buildExportRows(decisiones, sesionesByPk, participantesByPk, componentes);
        return {
          success: true,
          exportado_en: new Date().toISOString(),
          total_registros: data.length,
          data
        };
      })
    );
  }

  private async fetchExportBundle() {
    const { data: decisiones, error: e1 } = await this.client
      .from('decisiones_porcionamiento')
      .select('*')
      .order('fk_sesion')
      .order('orden_servicio');

    if (e1) {
      throw new Error(pgErr(e1));
    }
    const dlist = decisiones || [];
    const sesionIds = [...new Set(dlist.map((d: any) => d.fk_sesion))];
    let sesiones: any[] = [];
    if (sesionIds.length) {
      const { data, error } = await this.client
        .from('sesiones_juego')
        .select('*')
        .in('pk_sesion', sesionIds);
      if (error) {
        throw new Error(pgErr(error));
      }
      sesiones = data || [];
    }
    const partIds = [...new Set(sesiones.map((s: any) => s.fk_participante))];
    let participantes: any[] = [];
    if (partIds.length) {
      const { data, error } = await this.client
        .from('participantes')
        .select('*')
        .in('pk_participante', partIds);
      if (error) {
        throw new Error(pgErr(error));
      }
      participantes = data || [];
    }
    const { data: componentes, error: e2 } = await this.client
      .from('componentes')
      .select('pk_alimento, nombre, categoria, unidad');

    if (e2) {
      throw new Error(pgErr(e2));
    }

    const sesionesByPk = new Map(sesiones.map((s: any) => [s.pk_sesion, s]));
    const participantesByPk = new Map(participantes.map((p: any) => [p.pk_participante, p]));

    return {
      decisiones: dlist,
      sesionesByPk,
      participantesByPk,
      componentes: componentes || []
    };
  }

  // ===================================
  // SISTEMA
  // ===================================

  checkHealth(): Observable<any> {
    return ofHealth();
  }

  testConnection(): Observable<any> {
    return from(
      this.client.from('participantes').select('pk_participante').limit(1)
    ).pipe(
      map(({ error }) => {
        if (error) {
          return {
            status: 'ERROR',
            connection: 'Failed',
            error: pgErr(error)
          };
        }
        return {
          status: 'OK',
          connection: 'Successful',
          timestamp: new Date().toISOString()
        };
      })
    );
  }
}

function ofHealth(): Observable<any> {
  return from(Promise.resolve({ status: 'OK', timestamp: new Date().toISOString(), source: 'supabase' }));
}

function ofMenusPlatos(payload: any) {
  return from(Promise.resolve(payload)).pipe(
    map(data => ({ success: true, data, total: data.length }))
  );
}
