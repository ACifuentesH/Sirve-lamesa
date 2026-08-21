import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { FilaVista, buildExportRows, generarCSV } from '../utils/research-export';

/**
 * Lectura del estudio para el panel de investigadores.
 *
 * Este servicio tenía además el CRUD completo del juego viejo: participantes,
 * sesiones, personajes, ingredientes, menús, platos, bebidas, decisiones y
 * estadísticas calculadas a mano sobre `decisiones_porcionamiento`. Todo eso
 * consultaba tablas que la arquitectura nueva ya no usa, y sus únicos llamadores
 * eran la pantalla de juego y el login, retirados en el issue #24.
 *
 * Lo que queda son las tres lecturas que el panel sí hace, y las tres van contra la
 * misma vista `respuestas_experimento` (ADR-0003): el panel y las dos exportaciones
 * no pueden discrepar porque leen la misma fila.
 *
 * La escritura no está aquí: el envío del participante es transaccional y va por la
 * RPC `registrar_respuesta_experimento` (ADR-0001), en `EnvioService`.
 */
function pgErr(e: PostgrestError | null): string {
  return e?.message || 'Error de Supabase';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly client: SupabaseClient = inject(SupabaseService).client;

  /**
   * El panel lee la misma vista que el CSV. Cero filas sin error es un estudio
   * vacío o una sesión de investigador que aún no está en la lista blanca, no un
   * fallo de red.
   */
  obtenerDatosInvestigador(): Observable<{ success: true; data: FilaVista[] }> {
    return from(this.fetchVistaRespuestas()).pipe(
      map(filas => ({ success: true, data: filas }))
    );
  }

  /** CSV con BOM UTF-8, una fila por decisión. */
  obtenerExportacionCSV(): Observable<string> {
    return from(this.fetchVistaRespuestas()).pipe(
      map(filas => generarCSV(buildExportRows(filas)))
    );
  }

  obtenerExportacionJSON(): Observable<{ success: boolean; exportado_en: string; total_registros: number; data: unknown[] }> {
    return from(this.fetchVistaRespuestas()).pipe(
      map(filas => {
        const data = buildExportRows(filas);
        return {
          success: true,
          exportado_en: new Date().toISOString(),
          total_registros: data.length,
          data
        };
      })
    );
  }

  /**
   * La vista respuestas_experimento ya cruza participante, sesión y decisión, y viene
   * ordenada. Solo la lee un investigador de la lista blanca (migración 013): si
   * devuelve cero filas sin error, lo que falta es la sesión, no los datos.
   */
  private async fetchVistaRespuestas(): Promise<FilaVista[]> {
    const { data, error } = await this.client.from('respuestas_experimento').select('*');

    if (error) {
      throw new Error(pgErr(error));
    }

    return (data ?? []) as FilaVista[];
  }
}
