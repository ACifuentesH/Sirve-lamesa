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
 * Lo que se sortea no es una asignación suelta sino la SECUENCIA entera de la sesión:
 * `ASIGNACIONES_POR_PARTICIPANTE` platos, uno por personaje. Con la constante en 1 la
 * secuencia tiene un solo elemento y el comportamiento es idéntico al de siempre; con
 * la constante en 8 el participante sirve ocho platos seguidos sin tocar un componente.
 * Esa es la razón de que el índice viva aquí y no en el simulador: el orden de servicio
 * es un dato del experimento (`orden_servicio` en el esquema), no estado de pantalla.
 *
 * Muestreo SIN REEMPLAZO: los personajes de la secuencia son distintos entre sí. Servir
 * dos veces al mismo personaje no aportaría una medida nueva y sí confundiría al
 * participante. Si la constante supera el tamaño del pool se sirve el pool entero y se
 * para ahí — se recorta en silencio en vez de repetir.
 *
 * El momento del día se sortea POR ASIGNACIÓN, no una vez por sesión: cada plato es una
 * decisión independiente y fijar el momento acoplaría todos los platos al mismo catálogo.
 *
 * La secuencia se cachea mientras viva la pestaña, no se persiste: recargar sortea de
 * nuevo, que es el comportamiento que pide B4.
 */
@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly catalogo = inject(CatalogoService);
  private secuencia$?: Observable<readonly Asignacion[]>;

  /** Posición (base 0) dentro de la secuencia. Avanza solo con `avanzar()`. */
  private indice = 0;

  /**
   * Longitud real de la secuencia una vez sorteada. Puede ser menor que la constante
   * si el pool es más pequeño. Vale 0 mientras el pool no haya cargado.
   */
  private longitud = 0;

  /**
   * La secuencia completa de la sesión. Se sortea una sola vez —al preparar la
   * simulación— y no vuelve a moverse: si se re-sorteara a mitad, los platos ya
   * enviados quedarían atribuidos a personajes que el participante nunca vio.
   */
  obtenerSecuencia(): Observable<readonly Asignacion[]> {
    if (!this.secuencia$) {
      this.secuencia$ = this.catalogo.obtenerPool().pipe(
        map(pool => {
          if (!pool.length) {
            throw new Error('El pool de personajes está vacío: falta cargar seed_personajes.sql.');
          }
          return this.sortearSecuencia(pool);
        }),
        tap({
          next: secuencia => { this.longitud = secuencia.length; },
          error: () => { this.secuencia$ = undefined; }
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.secuencia$;
  }

  /**
   * La asignación que toca servir ahora. El índice se lee al suscribirse, no al
   * construir el observable: por eso volver a suscribirse después de `avanzar()`
   * entrega ya el personaje siguiente sobre la misma secuencia cacheada.
   */
  obtenerAsignacion(): Observable<Asignacion> {
    return this.obtenerSecuencia().pipe(
      map(secuencia => {
        const actual = secuencia[this.indice];
        if (!actual) {
          throw new Error('La secuencia de asignaciones ya está agotada.');
        }
        return actual;
      })
    );
  }

  /**
   * Valor configurado en el contrato. No coincide necesariamente con
   * `totalAsignaciones`: si el pool tiene menos personajes que este número, la
   * secuencia se recorta.
   */
  get asignacionesPorParticipante(): number {
    return ASIGNACIONES_POR_PARTICIPANTE;
  }

  /** Platos que se van a servir de verdad en esta sesión. 0 hasta que carga el pool. */
  get totalAsignaciones(): number {
    return this.longitud;
  }

  /** Posición del plato actual en base 1, como el `orden_servicio` del esquema. */
  get ordenServicio(): number {
    return this.indice + 1;
  }

  /** `true` si tras el plato actual todavía queda alguien a quien servir. */
  get hayPendientes(): boolean {
    return this.indice + 1 < this.longitud;
  }

  /**
   * Pasa al siguiente personaje de la secuencia. Devuelve `false` cuando el plato
   * recién servido era el último, que es la señal para cerrar la sesión. Con la
   * constante en 1 siempre devuelve `false` al primer intento.
   */
  avanzar(): boolean {
    if (!this.hayPendientes) {
      return false;
    }
    this.indice += 1;
    return true;
  }

  limpiar(): void {
    this.secuencia$ = undefined;
    this.indice = 0;
    this.longitud = 0;
  }

  /**
   * Baraja de Fisher-Yates completa y corte por la cabeza. Barajar entero cuesta
   * nada con ocho personajes y garantiza que cada uno tiene la misma probabilidad
   * de salir primero: con la constante en 1 el sorteo sigue siendo uniforme sobre
   * el pool completo, igual que el `Math.random()` de antes.
   */
  private sortearSecuencia(pool: readonly Personaje[]): Asignacion[] {
    const cuantas = Math.min(
      Math.max(1, Math.trunc(this.asignacionesPorParticipante)),
      pool.length
    );

    const barajado = pool.slice();
    for (let i = barajado.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [barajado[i], barajado[j]] = [barajado[j], barajado[i]];
    }

    return barajado.slice(0, cuantas).map(personaje => ({
      personaje,
      momento_dia: MOMENTOS_DIA[Math.floor(Math.random() * MOMENTOS_DIA.length)]
    }));
  }
}
