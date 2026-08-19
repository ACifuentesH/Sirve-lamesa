import { Injectable, inject } from '@angular/core';
import { Observable, from, map, shareReplay } from 'rxjs';
import { AlimentoCatalogo, MomentoDia, Personaje } from '../models/contrato';
import { SupabaseService } from './supabase.service';

/**
 * Catálogo de alimentos y pool de personajes (Vía B, tarea B2).
 *
 * El plan pedía un `GET /api/catalogo?momento=` en Express, pero el ADR-0001 retira
 * Express: la lectura va directa a Supabase, donde `anon` tiene SELECT sobre las
 * tablas de estímulo (migración 009). El criterio de aceptación se mantiene: 11
 * alimentos en desayuno, 12 en almuerzo, 11 en cena.
 *
 * El catálogo se cachea por momento con shareReplay. No cambia durante una sesión y
 * el menú lateral lo consulta al montar cada pestaña.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly client = inject(SupabaseService).client;
  private readonly cache = new Map<MomentoDia, Observable<AlimentoCatalogo[]>>();

  obtenerCatalogo(momento: MomentoDia): Observable<AlimentoCatalogo[]> {
    const cacheado = this.cache.get(momento);
    if (cacheado) {
      return cacheado;
    }

    const peticion = from(
      this.client
        .from('catalogo_alimentos')
        .select('pk_alimento, slug, nombre, momento_dia, grupo, tipo, unidad_display, peso_gramos, es_bebida, imagen, orden')
        .eq('momento_dia', momento)
        .order('orden')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`No se pudo cargar el catálogo de ${momento}: ${error.message}`);
        }
        return (data ?? []).map(fila => this.aAlimento(fila));
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cache.set(momento, peticion);
    return peticion;
  }

  /**
   * Pool de la matriz de estímulos (§4.1). El filtro por `slug` es lo que separa a los
   * 8 personajes nuevos de los antiguos, que siguen en la tabla porque hay decisiones
   * ya grabadas que los referencian.
   */
  obtenerPool(): Observable<Personaje[]> {
    return from(
      this.client
        .from('personajes')
        .select('pk_personaje, slug, nombre, perfil_edad, edad_rango, sexo, pronombre, imagen')
        .not('slug', 'is', null)
        .order('pk_personaje')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`No se pudo cargar el pool de personajes: ${error.message}`);
        }
        return (data ?? []).map(fila => this.aPersonaje(fila));
      })
    );
  }

  private aAlimento(fila: any): AlimentoCatalogo {
    return {
      id: fila.pk_alimento,
      slug: fila.slug,
      nombre: fila.nombre,
      momento_dia: fila.momento_dia,
      grupo: fila.grupo,
      tipo: fila.tipo,
      unidad_display: fila.unidad_display,
      peso_gramos: fila.peso_gramos,
      es_bebida: fila.es_bebida,
      imagen: fila.imagen,
      orden: fila.orden
    };
  }

  private aPersonaje(fila: any): Personaje {
    return {
      id: fila.pk_personaje,
      slug: fila.slug,
      nombre: fila.nombre,
      perfil_edad: fila.perfil_edad,
      edad_rango: fila.edad_rango,
      genero: fila.sexo,
      imagen: fila.imagen,
      pronombre: fila.pronombre
    };
  }
}
