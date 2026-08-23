/**
 * Credenciales de cliente del proyecto Sirve la Mesa.
 *
 * La clave publicable (sb_publishable_…) está pensada para ir en el bundle del
 * navegador: no es un secreto. La anon JWT sí lo era, y por eso salió de git.
 * Estas constantes son el respaldo cuando .env todavía tiene el placeholder de
 * .env.example (TU-PROYECTO / sb_publishable_...): copiar el ejemplo y arrancar
 * no debe dejar la simulación muda.
 *
 * SUPABASE_URL / SUPABASE_ANON_KEY en el entorno o en .env mandan sobre esto.
 */
export const SUPABASE_PROYECTO = {
  url: 'https://kpkrriyluwbcajqmlfiw.supabase.co',
  anonKey: 'sb_publishable_2Dc2TkYvxowdkRAMEWb93g_i8Wiivbn'
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
 * @returns {{ url: string, key: string, usoRespaldo: boolean }}
 */
export function resolverCredencialesSupabase(bruto = {}) {
  const url = (bruto.url ?? '').trim();
  const key = (bruto.key ?? '').trim();
  const urlVacia = esPlaceholderUrl(url);
  const keyVacia = esPlaceholderKey(key);

  if (!urlVacia && !keyVacia) {
    return { url, key, usoRespaldo: false };
  }

  return {
    url: urlVacia ? SUPABASE_PROYECTO.url : url,
    key: keyVacia ? SUPABASE_PROYECTO.anonKey : key,
    usoRespaldo: true
  };
}
