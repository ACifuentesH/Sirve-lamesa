import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { finalize, retry, tap, timeout } from 'rxjs/operators';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { PayloadEnvio, RespuestaEnvio, RPC_REGISTRAR_RESPUESTA } from '../models/contrato';

/**
 * Por qué se distingue la causa: un fallo de red se arregla reintentando, y un
 * fallo de validación no. La RPC valida todo el payload y lanza excepción
 * (SQLSTATE P0001) cuando algo no cuadra; reintentar eso tres veces solo retrasa
 * el mensaje y hace creer al participante que el problema es su conexión.
 */
export type CausaFallo = 'red' | 'timeout' | 'validacion';

export interface FalloEnvio {
  causa: CausaFallo;
  /** Texto que se muestra al participante. */
  mensaje: string;
  /** Mensaje técnico de la RPC. Para depurar; nunca se muestra en pantalla. */
  detalle?: string;
}

/** Texto literal exigido por la §6.2 del documento de especificaciones. */
const MENSAJE_CONEXION = 'Error de conexión. Por favor, inténtalo de nuevo';

/**
 * PENDIENTE (issue #1): el documento no define copy para un payload rechazado por
 * el servidor, porque no lo previó. Reintentar no lo arregla, así que no puede
 * reutilizar el mensaje de conexión. Confirmar la redacción con la Fundación.
 */
const MENSAJE_RECHAZO = 'No pudimos registrar tu respuesta. Por favor, avisa a la persona a cargo del estudio.';

/** Esperas entre reintentos (§A7). Son tres reintentos sobre el intento inicial. */
const RETRASOS_MS = [1000, 3000, 7000];

const TIMEOUT_MS = 15000;

const CLAVE_RESPALDO = 'sirve.envio.pendiente';

// Vía A (issue #12): única puerta de envío del experimento. Llama a la RPC
// registrar_respuesta_experimento (ADR-0001), que escribe participante, sesión y
// decisión en una sola transacción.
//
// La §6.2 exige que "si hay un fallo de red, el sistema no se cierra": de ahí el
// respaldo en localStorage antes del primer intento, que solo se borra cuando el
// servidor confirma. Si el participante recarga tras un fallo, el payload sigue ahí.
@Injectable({ providedIn: 'root' })
export class EnvioService {
  private readonly client: SupabaseClient = inject(SupabaseService).client;

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  private readonly isSuccessSubject = new BehaviorSubject<boolean>(false);
  private readonly errorEnvioSubject = new BehaviorSubject<FalloEnvio | null>(null);

  readonly isSubmitting$ = this.isSubmittingSubject.asObservable();
  readonly isSuccess$ = this.isSuccessSubject.asObservable();
  readonly errorEnvio$ = this.errorEnvioSubject.asObservable();

  /** El payload vive en memoria mientras haya un envío sin confirmar. */
  private pendiente: PayloadEnvio | null = null;

  get isSubmitting(): boolean {
    return this.isSubmittingSubject.value;
  }

  get isSuccess(): boolean {
    return this.isSuccessSubject.value;
  }

  get errorEnvio(): FalloEnvio | null {
    return this.errorEnvioSubject.value;
  }

  /**
   * Envía el payload compilado por la Vía B (issue #22). El doble envío se corta
   * aquí y no solo en el botón: el modal se puede desmontar y volver a montar.
   */
  enviar(payload: PayloadEnvio): Observable<RespuestaEnvio> {
    if (this.isSubmitting) {
      return throwError(() => this.errorEnvio ?? { causa: 'red', mensaje: MENSAJE_CONEXION } as FalloEnvio);
    }

    this.pendiente = payload;
    this.guardarRespaldo(payload);
    return this.despachar(payload);
  }

  /**
   * Reintento manual desde el banner de error. Usa el payload en memoria y, si la
   * página se recargó, el del respaldo: por eso el respaldo se escribe antes del
   * primer intento y no después de fallar.
   */
  reintentar(): Observable<RespuestaEnvio> {
    const payload = this.pendiente ?? this.leerRespaldo();

    if (!payload) {
      return throwError(() => ({
        causa: 'validacion',
        mensaje: MENSAJE_RECHAZO,
        detalle: 'no hay ningun envio pendiente que reintentar'
      } as FalloEnvio));
    }

    this.pendiente = payload;
    return this.despachar(payload);
  }

  /** Permite ofrecer el reenvío tras una recarga (§A7). */
  hayEnvioPendiente(): boolean {
    return this.pendiente !== null || this.leerRespaldo() !== null;
  }

  obtenerEnvioPendiente(): PayloadEnvio | null {
    return this.pendiente ?? this.leerRespaldo();
  }

  /** Descarta el envío pendiente. Solo para cerrar el flujo tras un éxito o un abandono. */
  limpiar(): void {
    this.pendiente = null;
    this.borrarRespaldo();
    this.isSubmittingSubject.next(false);
    this.isSuccessSubject.next(false);
    this.errorEnvioSubject.next(null);
  }

  private despachar(payload: PayloadEnvio): Observable<RespuestaEnvio> {
    this.isSubmittingSubject.next(true);
    this.errorEnvioSubject.next(null);

    return this.intento(payload).pipe(
      retry({
        count: RETRASOS_MS.length,
        delay: (fallo: FalloEnvio, numeroReintento) => {
          // Un rechazo del servidor es definitivo: se propaga sin reintentar.
          if (fallo.causa === 'validacion') {
            throw fallo;
          }
          return timer(RETRASOS_MS[numeroReintento - 1]);
        }
      }),
      tap({
        next: () => {
          // El respaldo se borra solo con la confirmación del servidor en la mano.
          this.pendiente = null;
          this.borrarRespaldo();
          this.isSuccessSubject.next(true);
        },
        error: (fallo: FalloEnvio) => this.errorEnvioSubject.next(fallo)
      }),
      finalize(() => this.isSubmittingSubject.next(false))
    );
  }

  /**
   * Un intento aislado, con su propio AbortController: al vencer el timeout, el
   * operador se da de baja y el teardown cancela la petición en curso. Sin eso, la
   * petición abandonada seguiría viva y podría confirmarse en el servidor después
   * de que el reintento ya hubiera insertado la respuesta.
   */
  private intento(payload: PayloadEnvio): Observable<RespuestaEnvio> {
    return new Observable<RespuestaEnvio>(subscriber => {
      const controlador = new AbortController();

      this.client
        .rpc(RPC_REGISTRAR_RESPUESTA, { payload })
        .abortSignal(controlador.signal)
        .then(
          ({ data, error }) => {
            if (error) {
              subscriber.error(this.clasificar(error));
              return;
            }
            subscriber.next(data as RespuestaEnvio);
            subscriber.complete();
          },
          (err: unknown) => subscriber.error(this.clasificarExcepcion(err))
        );

      return () => controlador.abort();
    }).pipe(
      timeout({
        each: TIMEOUT_MS,
        with: () =>
          throwError(
            () =>
              ({
                causa: 'timeout',
                mensaje: MENSAJE_CONEXION,
                detalle: `sin respuesta en ${TIMEOUT_MS} ms`
              }) as FalloEnvio
          )
      })
    );
  }

  /**
   * P0001 es el SQLSTATE de RAISE EXCEPTION en plpgsql: es una validación de la RPC
   * y no se reintenta. Cualquier otro código (o su ausencia, típico de un fallo de
   * transporte) se trata como transitorio.
   */
  private clasificar(error: PostgrestError): FalloEnvio {
    if (error.code === 'P0001') {
      return { causa: 'validacion', mensaje: MENSAJE_RECHAZO, detalle: error.message };
    }
    return { causa: 'red', mensaje: MENSAJE_CONEXION, detalle: error.message };
  }

  /** Aquí caen los fallos de transporte: sin red, DNS, CORS o petición abortada. */
  private clasificarExcepcion(err: unknown): FalloEnvio {
    const detalle = err instanceof Error ? err.message : String(err);
    return { causa: 'red', mensaje: MENSAJE_CONEXION, detalle };
  }

  private guardarRespaldo(payload: PayloadEnvio): void {
    // Un localStorage lleno o deshabilitado (modo privado) no puede tumbar el envío:
    // el payload sigue en memoria, que es el camino normal.
    try {
      localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(payload));
    } catch {
      /* sin respaldo en disco; el envío continúa */
    }
  }

  private leerRespaldo(): PayloadEnvio | null {
    try {
      const crudo = localStorage.getItem(CLAVE_RESPALDO);
      return crudo ? (JSON.parse(crudo) as PayloadEnvio) : null;
    } catch {
      return null;
    }
  }

  private borrarRespaldo(): void {
    try {
      localStorage.removeItem(CLAVE_RESPALDO);
    } catch {
      /* nada que borrar */
    }
  }
}
