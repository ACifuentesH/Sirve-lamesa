/**
 * Genera los archivos de entorno de Angular desde variables de entorno.
 *
 *   node scripts/inject-supabase-env.mjs          -> environment.prod.ts  (CI/Vercel)
 *   node scripts/inject-supabase-env.mjs --dev    -> environment.ts       (local)
 *
 * Variables: SUPABASE_URL, SUPABASE_ANON_KEY, URL_FUNDACION. En local se pueden dejar
 * en angular-app/.env, que está fuera de git.
 *
 * Si faltan o siguen siendo el placeholder de .env.example (TU-PROYECTO /
 * sb_publishable_...), se usa la clave publicable del proyecto. Esa clave va en el
 * cliente a propósito; no es un secreto. Así `cp .env.example .env && npm start`
 * arranca la simulación en lugar de fallar al aceptar los términos.
 *
 * El archivo se sobrescribe completo, así que toda clave que consuma la app tiene que
 * salir de aquí: una que se omita desaparece del build y rompe la compilación de quien
 * la lea.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { resolverCredencialesSupabase } from './supabase-credentials.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const esDev = process.argv.includes('--dev');

/**
 * Lector mínimo de .env, para no añadir una dependencia por diez líneas. Las
 * variables ya presentes en el entorno mandan sobre el archivo: así CI no queda
 * a merced de un .env que alguien haya subido por error.
 */
function cargarDotEnv() {
  const ruta = join(root, '.env');
  if (!existsSync(ruta)) {
    return;
  }

  for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) {
      continue;
    }

    const separador = limpia.indexOf('=');
    if (separador === -1) {
      continue;
    }

    const clave = limpia.slice(0, separador).trim();
    const valor = limpia.slice(separador + 1).trim().replace(/^["']|["']$/g, '');

    if (!(clave in process.env)) {
      process.env[clave] = valor;
    }
  }
}

cargarDotEnv();

const credenciales = resolverCredencialesSupabase({
  url: process.env.SUPABASE_URL ?? '',
  key: process.env.SUPABASE_ANON_KEY ?? ''
});
const urlFundacion = process.env.URL_FUNDACION ?? '';

const destino = esDev ? 'environment.ts' : 'environment.prod.ts';
const envDir = join(root, 'src', 'environments');
mkdirSync(envDir, { recursive: true });
const out = join(envDir, destino);

const contents = `/* Generado por scripts/inject-supabase-env.mjs. No editar a mano ni versionar. */
export const environment = {
  production: ${esDev ? 'false' : 'true'},
  supabaseUrl: ${JSON.stringify(credenciales.url)},
  supabaseAnonKey: ${JSON.stringify(credenciales.key)},
  urlFundacion: ${JSON.stringify(urlFundacion)}
};
`;

writeFileSync(out, contents, 'utf8');

if (credenciales.usoRespaldo) {
  console.warn(
    `⚠️  ${destino}: SUPABASE_URL o SUPABASE_ANON_KEY vacíos o de plantilla; ` +
      'se usa la clave publicable del proyecto Sirve la Mesa. ' +
      (esDev
        ? 'Para otro proyecto, copia .env.example a .env y rellénalo.'
        : 'En el despliegue puedes sobreescribir las variables.')
  );
} else {
  console.log(`${destino} generado (SUPABASE_URL / SUPABASE_ANON_KEY / URL_FUNDACION).`);
}
