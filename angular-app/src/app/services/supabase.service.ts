import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Vía A (issue #7): un único cliente de Supabase para toda la app.
//
// Antes cada servicio creaba el suyo, y con clientes separados la sesión del
// investigador no sirve de nada: iniciar sesión en una instancia deja las lecturas
// de otra viajando con la clave anon, que ya no puede leer los datos del estudio.
//
// persistSession queda activo para que la sesión del investigador sobreviva a una
// recarga del panel. El participante nunca inicia sesión, así que en su flujo no se
// guarda nada.
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
}
