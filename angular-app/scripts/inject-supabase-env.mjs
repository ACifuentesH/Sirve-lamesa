/**
 * Genera los archivos de entorno de Angular desde variables de entorno.
 *
 *   node scripts/inject-supabase-env.mjs          -> environment.prod.ts  (CI/Vercel)
 *   node scripts/inject-supabase-env.mjs --dev    -> environment.ts       (local)
 *
 * Variables: SUPABASE_URL, SUPABASE_ANON_KEY, URL_FUNDACION. En local se pueden dejar
 * en angular-app/.env, que está fuera de git.
 *
 * Por qué también el de desarrollo: environment.ts vivía versionado con la clave
 * dentro, y el repositorio es público. Ninguna clave vuelve a entrar en git; el
 * archivo se genera en cada arranque y está en .gitignore.
 *
 * El archivo se sobrescribe completo, así que toda clave que consuma la app tiene que
 * salir de aquí: una que se omita desaparece del build y rompe la compilación de quien
 * la lea.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
const urlFundacion = process.env.URL_FUNDACION ?? '';

const destino = esDev ? 'environment.ts' : 'environment.prod.ts';
const envDir = join(root, 'src', 'environments');
mkdirSync(envDir, { recursive: true });
const out = join(envDir, destino);

const contents = `/* Generado por scripts/inject-supabase-env.mjs. No editar a mano ni versionar. */
export const environment = {
  production: ${esDev ? 'false' : 'true'},
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  urlFundacion: ${JSON.stringify(urlFundacion)}
};
`;

writeFileSync(out, contents, 'utf8');

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso y no error: hay tareas (lint, pruebas) que no necesitan credenciales.
  console.warn(
    `⚠️  ${destino} generado SIN credenciales: falta SUPABASE_URL o SUPABASE_ANON_KEY. ` +
      (esDev ? 'Copia .env.example a .env y rellénalo.' : 'Revisa las variables del entorno de despliegue.')
  );
} else {
  console.log(`${destino} generado (SUPABASE_URL / SUPABASE_ANON_KEY / URL_FUNDACION).`);
}
