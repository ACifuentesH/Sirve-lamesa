import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
// Regla de "¿esto sigue siendo el placeholder de .env.example?" compartida con el
// script de build (scripts/inject-supabase-env.mjs, vía scripts/supabase-credentials.mjs).
// Es JS puro sin dependencias de Node ni del navegador: se puede importar tal cual
// desde TypeScript sin arrastrar nada del script de build al bundle. Ver issue #45.
// @ts-expect-error -- .mjs sin declaración de tipos; JSDoc del propio archivo basta.
import { credencialesSupabaseValidas } from '../../../scripts/supabase-credentials.mjs';

// Vía A (issue #7): un único cliente de Supabase para toda la app.
//
// Antes cada servicio creaba el suyo, y con clientes separados la sesión del
// investigador no sirve de nada: iniciar sesión en una instancia deja las lecturas
// de otra viajando con la clave anon, que ya no puede leer los datos del estudio.
//
// persistSession queda activo para que la sesión del investigador sobreviva a una
// recarga del panel. El participante nunca inicia sesión, así que en su flujo no se
// guarda nada.
//
// createClient se retrasa al primer uso: si la URL o la clave están mal, el error
// lo atrapa el simulador al cargar el catálogo, en lugar de tumbar el bootstrap
// de Angular al aceptar los términos.
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private instancia: SupabaseClient | null = null;

  get client(): SupabaseClient {
    if (this.instancia) {
      return this.instancia;
    }

    const url = environment.supabaseUrl?.trim() ?? '';
    const key = environment.supabaseAnonKey?.trim() ?? '';

    if (!credencialesSupabaseValidas({ url, key })) {
      throw new Error(
        'Faltan las credenciales de Supabase. Copia angular-app/.env.example a .env, rellena ' +
          'los valores reales (panel de Supabase → Project Settings → Data API) y vuelve a ejecutar npm start.'
      );
    }

    try {
      this.instancia = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    } catch (err) {
      const detalle = err instanceof Error ? err.message : 'configuración inválida';
      throw new Error(`No se pudo iniciar la conexión con el estudio (${detalle}).`);
    }

    return this.instancia;
  }
}
