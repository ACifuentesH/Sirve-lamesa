import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

/** Función de la BD que decide el acceso (migración 013). */
const RPC_ES_INVESTIGADOR = 'es_investigador';

export type ResultadoAcceso = { ok: true } | { ok: false; mensaje: string };

// Vía A (issue #7): sesión del investigador para el panel de análisis.
//
// Es una sesión real de Supabase Auth, no una contraseña en el frontend: el RLS de
// la base de datos solo entrega los datos del estudio a un JWT cuyo correo esté en
// la lista blanca. Sin esto, el panel no tiene forma de leer nada.
@Injectable({ providedIn: 'root' })
export class InvestigadorService {
  private readonly client = inject(SupabaseService).client;

  private readonly correoSubject = new BehaviorSubject<string | null>(null);
  readonly correo$ = this.correoSubject.asObservable();

  get correo(): string | null {
    return this.correoSubject.value;
  }

  async iniciarSesion(email: string, password: string): Promise<ResultadoAcceso> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });

    if (error) {
      // Un mensaje único para credenciales malas y para cuenta inexistente: decir
      // cuál de las dos falló permite averiguar qué correos tienen cuenta.
      return { ok: false, mensaje: 'Correo o contraseña incorrectos.' };
    }

    if (!(await this.estaAutorizado())) {
      // Tener cuenta no es tener acceso. Se cierra la sesión para no dejar al
      // navegador con un JWT válido que no sirve para nada.
      await this.cerrarSesion();
      return { ok: false, mensaje: 'Esta cuenta no está autorizada para consultar el estudio.' };
    }

    return { ok: true };
  }

  async cerrarSesion(): Promise<void> {
    await this.client.auth.signOut();
    this.correoSubject.next(null);
  }

  /**
   * La autorización se pregunta a la base de datos, que es quien decide de verdad:
   * comprobarla solo en el cliente sería decorativo, porque el RLS resuelve igual y
   * un panel "abierto" mostraría cero filas sin explicar por qué.
   */
  async estaAutorizado(): Promise<boolean> {
    const { data: sesion } = await this.client.auth.getSession();

    if (!sesion.session) {
      this.correoSubject.next(null);
      return false;
    }

    const { data, error } = await this.client.rpc(RPC_ES_INVESTIGADOR);

    if (error || data !== true) {
      this.correoSubject.next(null);
      return false;
    }

    this.correoSubject.next(sesion.session.user.email ?? null);
    return true;
  }
}
