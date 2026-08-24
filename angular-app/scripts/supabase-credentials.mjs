/**
 * Reglas de credenciales de cliente del proyecto Sirve la Mesa.
 *
 * Hasta el issue #45 este módulo traía un respaldo con la URL y la clave publicable
 * REALES del proyecto, para que arrancar sin `.env` no dejara la simulación muda.
 * Ese respaldo quedaba versionado en texto plano (justo lo que el README decía que
 * no pasaba) y, además, la clave ya no es válida: el proyecto la rechaza con
 * HTTP 401. Se retiró. `PLACEHOLDER_SUPABASE` ya NO es un valor que funcione: es
 * solo el texto de plantilla de `.env.example`, para que el mensaje de error lo
 * pueda citar.
 *
 * `esPlaceholderUrl` / `esPlaceholderKey` son la ÚNICA definición de la regla
 * "esto todavía es el placeholder de la plantilla, no un valor real". La reutilizan:
 *   - este script (Node, en build time — ver inject-supabase-env.mjs), y
 *   - `SupabaseService` en el navegador (última línea de defensa: por si
 *     `environment.ts` se generó, o quedó, con estos valores de plantilla).
 * No hay Node ni navegador en este archivo (sin `fs`, sin DOM): es JS puro,
 * por eso ambos lados pueden importarlo tal cual sin arrastrar nada del otro runtime.
 */
export const PLACEHOLDER_SUPABASE = {
  url: 'https://TU-PROYECTO.supabase.co',
  key: 'sb_publishable_...'
};

export function esPlaceholderUrl(url) {
  const valor = (url ?? '').trim();
  if (!valor) {
    return true;
  }
  return /TU-PROYECTO|your-project|example\.supabase|xxxxx\.supabase/i.test(valor);
}

export function esPlaceholderKey(key) {
  const valor = (key ?? '').trim();
  if (!valor) {
    return true;
  }
  return valor === 'sb_publishable_...' || /^sb_publishable_\.+$/i.test(valor);
}

/**
 * @param {{ url?: string, key?: string }} bruto
 * @returns {boolean} true si falta alguna, o si sigue siendo el placeholder de la plantilla.
 */
export function credencialesSupabaseValidas(bruto = {}) {
  return !esPlaceholderUrl(bruto.url) && !esPlaceholderKey(bruto.key);
}
