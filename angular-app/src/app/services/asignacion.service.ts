import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { ASIGNACIONES_POR_PARTICIPANTE, MOMENTOS_DIA, MomentoDia, Personaje } from '../models/contrato';
import { CatalogoService } from './catalogo.service';

export interface Asignacion {
  personaje: Personaje;
  momento_dia: MomentoDia;
}

/**
 * Asignación aleatoria de personaje y momento del día (§4.1, decisión 2 del plan).
 *
 * Una sola fuente para toda la pantalla: el banner, el avatar y el menú lateral leen
 * de aquí. Si cada uno sorteara por su cuenta, el banner podría anunciar a María
 * mientras el avatar muestra a Juan, que es justo lo que los criterios de aceptación
 * de B3 y B4 prohíben.
 *
 * La asignación se cachea mientras viva la pestaña, no se persiste: recargar sortea de
 * nuevo, que es el comportamiento que pide B4.
 */
@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly catalogo = inject(CatalogoService);
  private asignacion$?: Observable<Asignacion>;

  obtenerAsignacion(): Observable<Asignacion> {
    if (!this.asignacion$) {
      this.asignacion$ = this.catalogo.obtenerPool().pipe(
        map(pool => {
          if (!pool.length) {
            throw new Error('El pool de personajes está vacío: falta cargar seed_personajes.sql.');
          }
          return {
            personaje: pool[Math.floor(Math.random() * pool.length)],
            momento_dia: MOMENTOS_DIA[Math.floor(Math.random() * MOMENTOS_DIA.length)]
          };
        }),
        tap({ error: () => { this.asignacion$ = undefined; } }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.asignacion$;
  }

  /**
   * El diseño es entre-sujetos: un personaje por participante mientras la constante
   * del contrato valga 1. Queda expuesto para que el simulador no dé por supuesto el
   * caso de una sola asignación si algún día la Fundación pide varias (issue #1).
   */
  get asignacionesPorParticipante(): number {
    return ASIGNACIONES_POR_PARTICIPANTE;
  }

  limpiar(): void {
    this.asignacion$ = undefined;
  }
}
