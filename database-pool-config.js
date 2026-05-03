/**
 * Opciones compartidas para `pg` (servidor Express e `init-database.js`).
 * Las URLs de Supabase requieren TLS; el host suele incluir "supabase".
 */
function getPgPoolConfig() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://localhost:5432/sirve_la_mesa';

  const needsSsl =
    connectionString.includes('supabase') ||
    process.env.NODE_ENV === 'production';

  return {
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    // Evita que cada petición cuelgue minutos si Postgres no responde (mal URL, red, proyecto Supabase pausado).
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS) || 15000,
  };
}

module.exports = { getPgPoolConfig };
