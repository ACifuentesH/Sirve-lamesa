/**
 * Escribe environment.prod.ts desde variables de entorno (p. ej. Vercel).
 * Variables: SUPABASE_URL, SUPABASE_ANON_KEY, URL_FUNDACION
 *
 * Toda clave que consuma la app tiene que salir de aquí: el archivo se sobrescribe
 * completo, así que una clave omitida desaparece del build de producción y rompe la
 * compilación de quien la lea.
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out = join(root, 'src', 'environments', 'environment.prod.ts');

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
const urlFundacion = process.env.URL_FUNDACION ?? '';

const contents = `/* Generado por scripts/inject-supabase-env.mjs (CI/Vercel). */
export const environment = {
  production: true,
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  urlFundacion: ${JSON.stringify(urlFundacion)}
};
`;

writeFileSync(out, contents, 'utf8');
console.log('environment.prod.ts generado (SUPABASE_URL / SUPABASE_ANON_KEY / URL_FUNDACION).');
