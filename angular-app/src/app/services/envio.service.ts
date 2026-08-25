import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, defer, throwError, timer } from 'rxjs';
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

/**
 * Clave de idempotencia del envío. Es metadato de transporte, no un dato del
 * experimento: por eso viaja junto al payload y no dentro de `PayloadEnvio`, que
 * está congelado por el contrato de la Fase 0 (issue #2).
 *
 * Se acuña una sola vez por respuesta y la reutilizan TODOS los caminos de
 * reenvío: el reintento automático del backoff, el botón "Inténtalo de nuevo" y
 * el reenvío tras una recarga. Solo desaparece cuando el servidor confirma.
 */
type SobreRpc = PayloadEnvio & { envio_id: string };

/**
 * Lo que la RPC devuelve de verdad. `duplicado` es la respuesta del servidor a la
 * clave de idempotencia: `true` cuando reconoció el `envio_id` y devolvió los ids
 * de la escritura original en vez de insertar otra vez (migración 015).
 *
 * Vive aquí y no en `RespuestaEnvio` por la misma razón que `envio_id` no vive en
 * `PayloadEnvio`: es metadato de transporte y el contrato de la Fase 0 (issue #2)
 * está congelado. Opcional porque una RPC anterior a la 015 no lo mandaba.
 */
type RespuestaRpc = RespuestaEnvio & { duplicado?: boolean };

/** Forma del respaldo en localStorage: el payload y la clave que lo identifica. */
interface RespaldoEnvio {
  envio_id: string;
  payload: PayloadEnvio;
  guardado_en: string;
}

/**
 * Identificador único del envío. `crypto.randomUUID` solo existe en contexto
 * seguro (https o localhost); el respaldo cubre http plano en pruebas de campo.
 */
function nuevoEnvioId(): string {
  const cripto = globalThis.crypto;

  if (cripto?.randomUUID) {
    return cripto.randomUUID();
  }

  if (cripto?.getRandomValues) {
    const bytes = cripto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`;
}

// Vía A (issue #12): única puerta de envío del experimento. Llama a la RPC
// registrar_respuesta_experimento (ADR-0001), que escribe participante, sesión y
// decisión en una sola transacción.
//
// La §6.2 exige que "si hay un fallo de red, el sistema no se cierra": de ahí el
// respaldo en localStorage antes del primer intento, que solo se borra cuando el
// servidor confirma. Si el participante recarga tras un fallo, el payload sigue ahí.
//
// SOBRE LA NO DUPLICACIÓN (criterio "el reintento tiene éxito y no duplica el
// registro"): reenviar es seguro solo si el servidor sabe reconocer un reenvío.
// Un timeout no significa "no se guardó", significa "no sé si se guardó": la
// petición llegó y la transacción pudo confirmarse mientras se agotaban los 15 s.
// Por eso cada respuesta lleva un `envio_id` estable que sobrevive al backoff, al
// botón de reintento y a una recarga.
//
// La otra mitad es del servidor y YA ESTÁ HECHA: la migración 015 (aplicada en
// producción) añadió `Sesiones_juego.envio_id` con un índice UNIQUE, y la RPC
// corta el circuito cuando ese UUID ya existe: devuelve los ids de la escritura
// original con `duplicado: true` en lugar de insertar de nuevo. La carrera de dos
// peticiones simultáneas con el mismo `envio_id` la absorbe el propio índice,
// dentro de la RPC. Un reenvío tras un timeout ya NO duplica participante, sesión
// ni decisión.
//
// Por eso este cliente NO lleva —ni debe llevar— una protección propia contra
// duplicados: la deduplicación es del servidor, que es el único sitio donde puede
// ser correcta. Reconstruirla aquí solo añadiría caminos por los que perder una
// respuesta. Lo que sí hace el cliente es leer `duplicado` (ver `RespuestaRpc`)
// para no confundir un reenvío absorbido con un fallo.
@Injectable({ providedIn: 'root' })
export class EnvioService {
  private readonly supabase = inject(SupabaseService);

  private get client(): SupabaseClient {
    return this.supabase.client;
  }

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  private readonly isSuccessSubject = new BehaviorSubject<boolean>(false);
  private readonly errorEnvioSubject = new BehaviorSubject<FalloEnvio | null>(null);

  readonly isSubmitting$ = this.isSubmittingSubject.asObservable();
  readonly isSuccess$ = this.isSuccessSubject.asObservable();
  readonly errorEnvio$ = this.errorEnvioSubject.asObservable();

  /** El payload vive en memoria mientras haya un envío sin confirmar. */
  private pendiente: PayloadEnvio | null = null;

  /** Clave de idempotencia del envío pendiente. Vive tanto como el payload. */
  private envioId: string | null = null;

  /** Ver `respuestaYaEstabaGuardada`. */
  private duplicado = false;

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
   * `true` si la confirmación que cerró el último envío fue un reenvío absorbido:
   * el servidor reconoció el `envio_id`, no insertó nada y devolvió los ids de la
   * escritura original.
   *
   * Deliberadamente NO cambia nada de lo que ve el participante. Para él las dos
   * confirmaciones significan lo mismo —su respuesta está guardada— y anunciarle
   * "ya estaba guardada" solo le haría dudar de si envió dos veces, justo en el
   * punto del flujo donde no puede comprobarlo. El estudio tampoco necesita la
   * distinción: la fila registrada es la misma, con los mismos tiempos y la misma
   * secuencia de clics del intento original, que es el dato válido.
   *
   * Se expone porque distinguir un alta real de un reenvío absorbido es lo que
   * permite medir cuántos timeouts hubo en campo sin abrir la base.
   */
  get respuestaYaEstabaGuardada(): boolean {
    return this.duplicado;
  }

  /**
   * Envía el payload compilado por la Vía B (issue #22). El doble envío se corta
   * aquí y no solo en el botón: el modal se puede desmontar y volver a montar.
   */
  enviar(payload: PayloadEnvio): Observable<RespuestaEnvio> {
    if (this.isSubmitting) {
      return throwError(() => this.errorEnvio ?? { causa: 'red', mensaje: MENSAJE_CONEXION } as FalloEnvio);
    }

    // Si ya hay una respuesta sin confirmar se conserva su clave: el participante
    // puede haber retocado el plato tras un fallo, pero sigue siendo la única
    // respuesta de esta sesión y el servidor debe poder reconocerla como tal.
    const envioId = this.envioId ?? this.leerRespaldo()?.envio_id ?? nuevoEnvioId();

    return this.despachar(payload, envioId);
  }

  /**
   * Reintento manual desde el banner de error. Usa el payload en memoria y, si la
   * página se recargó, el del respaldo: por eso el respaldo se escribe antes del
   * primer intento y no después de fallar.
   */
  reintentar(): Observable<RespuestaEnvio> {
    const respaldo = this.leerRespaldo();
    const payload = this.pendiente ?? respaldo?.payload ?? null;
    const envioId = this.envioId ?? respaldo?.envio_id ?? null;

    if (!payload || !envioId) {
      return throwError(() => ({
        causa: 'validacion',
        mensaje: MENSAJE_RECHAZO,
        detalle: 'no hay ningun envio pendiente que reintentar'
      } as FalloEnvio));
    }

    return this.despachar(payload, envioId);
  }

  /** Permite ofrecer el reenvío tras una recarga (§A7). */
  hayEnvioPendiente(): boolean {
    return this.pendiente !== null || this.leerRespaldo() !== null;
  }

  obtenerEnvioPendiente(): PayloadEnvio | null {
    return this.pendiente ?? this.leerRespaldo()?.payload ?? null;
  }

  /** Descarta el envío pendiente. Solo para cerrar el flujo tras un éxito o un abandono. */
  limpiar(): void {
    this.pendiente = null;
    this.envioId = null;
    this.duplicado = false;
    this.borrarRespaldo();
    this.isSubmittingSubject.next(false);
    this.isSuccessSubject.next(false);
    this.errorEnvioSubject.next(null);
  }

  /**
   * `defer` para que el estado global cambie al suscribirse y no al construir el
   * observable: si nadie se suscribe, `isSubmitting` no puede quedarse en true y
   * dejar la pantalla bloqueada para siempre.
   */
  private despachar(payload: PayloadEnvio, envioId: string): Observable<RespuestaRpc> {
    return defer(() => {
      this.pendiente = payload;
      this.envioId = envioId;
      // El respaldo se escribe ANTES del primer intento: si la pestaña muere a
      // mitad de la petición, el payload sigue en disco para ofrecer el reenvío.
      this.guardarRespaldo(payload, envioId);

      this.duplicado = false;
      this.isSubmittingSubject.next(true);
      this.isSuccessSubject.next(false);
      this.errorEnvioSubject.next(null);

      return this.intento(payload, envioId);
    }).pipe(
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
        next: (respuesta: RespuestaRpc) => {
          // `duplicado: true` NO es un fallo ni una advertencia: es el servidor
          // diciendo "esta respuesta ya está guardada, aquí tienes sus ids". Se
          // trata exactamente igual que una inserción nueva —éxito, respaldo
          // borrado, ningún mensaje de error— porque el estado final del estudio
          // es el mismo y el respaldo ya no protege nada: lo que protegía está
          // escrito. Tratarlo como error sería lo peligroso: dejaría el respaldo
          // vivo e invitaría a un reenvío eterno de algo que ya se guardó.
          this.duplicado = respuesta.duplicado === true;

          // El respaldo se borra solo con la confirmación del servidor en la mano.
          this.pendiente = null;
          this.envioId = null;
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
  private intento(payload: PayloadEnvio, envioId: string): Observable<RespuestaRpc> {
    // El `envio_id` viaja dentro del jsonb porque es metadato de transporte y
    // `PayloadEnvio` está congelado. La RPC lo valida como UUID antes de nada; si
    // no lo es, guarda NULL y sigue adelante. Un identificador mal formado degrada
    // la protección contra duplicados, nunca cuesta una participación.
    const sobre: SobreRpc = { ...payload, envio_id: envioId };

    return new Observable<RespuestaRpc>(subscriber => {
      const controlador = new AbortController();

      this.client
        .rpc(RPC_REGISTRAR_RESPUESTA, { payload: sobre })
        .abortSignal(controlador.signal)
        .then(
          ({ data, error }) => {
            if (error) {
              subscriber.error(this.clasificar(error));
              return;
            }
            subscriber.next(data as RespuestaRpc);
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

  private guardarRespaldo(payload: PayloadEnvio, envioId: string): void {
    // Un localStorage lleno o deshabilitado (modo privado) no puede tumbar el envío:
    // el payload sigue en memoria, que es el camino normal.
    const respaldo: RespaldoEnvio = {
      envio_id: envioId,
      payload,
      guardado_en: new Date().toISOString()
    };

    try {
      localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(respaldo));
    } catch {
      /* sin respaldo en disco; el envío continúa */
    }
  }

  private leerRespaldo(): RespaldoEnvio | null {
    try {
      const crudo = localStorage.getItem(CLAVE_RESPALDO);
      if (!crudo) {
        return null;
      }

      const guardado = JSON.parse(crudo) as Partial<RespaldoEnvio> & Partial<PayloadEnvio>;

      if (guardado?.payload && typeof guardado.envio_id === 'string') {
        return guardado as RespaldoEnvio;
      }

      // Respaldo escrito antes de que existiera la clave de idempotencia: era el
      // payload pelado. Se le acuña una ahora para no perder la respuesta.
      //
      // Revisado con la 015 ya aplicada: este reenvío concreto sigue sin
      // protección contra duplicados y no la puede tener. Si el intento original
      // llegó a escribir, lo hizo sin `envio_id` —columna NULL, que el índice
      // UNIQUE no compara—, y ninguna clave acuñada después puede emparejarse
      // retroactivamente con esa fila. No es un descuido del cliente: es la única
      // grieta que la 015 no cierra, y cerrarla exigiría reconocer el reenvío por
      // el contenido del payload, no por su clave.
      //
      // Se asume porque la ventana es de una sola recarga y de un solo despliegue:
      // el primer despacho reescribe el respaldo ya en formato nuevo, así que
      // desde ahí todos los reenvíos comparten clave. Perder la respuesta de un
      // participante es peor que arriesgar una fila duplicada que el equipo puede
      // detectar en la base.
      if (guardado?.participante && guardado?.resultado_plato) {
        return {
          envio_id: nuevoEnvioId(),
          payload: guardado as PayloadEnvio,
          guardado_en: new Date().toISOString()
        };
      }

      return null;
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
