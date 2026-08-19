// Script para inicializar la base de datos
// Este script solo debe ejecutarse manualmente cuando se necesite
// resetear o crear la estructura de la base de datos por primera vez

require('dotenv').config();
try {
  require('dns').setDefaultResultOrder('ipv4first');
} catch (_) {
  /* Node < 17 */
}
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const { getPgPoolConfig } = require('./database-pool-config');

const pool = new Pool(getPgPoolConfig());

async function initDatabase() {
  try {
    console.log('='.repeat(60));
    console.log('🔧 INICIALIZANDO BASE DE DATOS - "Sirve la Mesa"');
    console.log('='.repeat(60));
    console.log('');
    console.log('⚠️  ADVERTENCIA: Este proceso eliminará todas las tablas existentes');
    console.log('    y recreará la estructura de la base de datos con datos iniciales.');
    console.log('');
    
    // Esperar 3 segundos para dar tiempo a cancelar
    console.log('⏳ Iniciando en 3 segundos... (Presiona Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    // Las migraciones se descubren leyendo la carpeta: enumerarlas a mano dejaba
    // fuera las nuevas al agregarlas. El prefijo numérico con ceros hace que el
    // orden alfabético sea el orden de aplicación.
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const nombresMigraciones = (await fs.readdir(migrationsDir))
      .filter(name => name.endsWith('.sql'))
      .sort();

    // Una migración marcada con "-- @manual" cambia el modelo de acceso y solo es
    // válida cuando el flujo de la app ya está al día. Aplicarla aquí, contra un
    // DATABASE_URL que apunte a Supabase, dejaría el simulador sin escritura.
    const migrations = [];
    const migracionesManuales = [];
    for (const name of nombresMigraciones) {
      const ruta = `database/migrations/${name}`;
      const contenido = await fs.readFile(path.join(migrationsDir, name), 'utf8');
      if (contenido.includes('-- @manual')) {
        migracionesManuales.push(ruta);
      } else {
        migrations.push(ruta);
      }
    }

    // Los datos de referencia van al final: el catálogo de alimentos necesita la
    // tabla que crea la migración 006, y sin ellos la RPC rechaza todo envío porque
    // valida cada alimento contra el catálogo.
    const seedsDir = path.join(__dirname, 'database', 'seeds');
    const semillas = (await fs.readdir(seedsDir))
      .filter(name => name.endsWith('.sql'))
      .sort()
      .map(name => `database/seeds/${name}`);

    const sqlFiles = [
      'database/schema.sql',
      'database/participantes.sql',
      'database/sesiones_juego.sql',
      'database/decisiones_porcionamiento.sql',
      'database/seed_data.sql',
      ...migrations,
      ...semillas
    ];

    console.log('📂 Archivos SQL a ejecutar:');
    sqlFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

    if (migracionesManuales.length > 0) {
      console.log('⏭️  Migraciones omitidas (marcadas como @manual):');
      migracionesManuales.forEach(file => console.log(`   - ${file}`));
      console.log('');
    }

    for (const file of sqlFiles) {
      try {
        const filePath = path.join(__dirname, file);
        const sql = await fs.readFile(filePath, 'utf8');
        await pool.query(sql);
        console.log(`✓ Ejecutado: ${file}`);
      } catch (err) {
        console.error(`✗ Error en ${file}:`, err.message);
        console.error('   Detalles:', err.stack);
        // Continuar con los demás archivos incluso si uno falla
      }
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Base de datos inicializada correctamente');
    console.log('='.repeat(60));
    console.log('');
    console.log('📝 Tablas creadas:');
    
    // Verificar tablas creadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('');
    console.log('🎮 Ahora puedes iniciar el servidor con: npm run dev');
    console.log('');
    
  } catch (err) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ ERROR GENERAL al inicializar la base de datos');
    console.error('='.repeat(60));
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Ejecutar la inicialización
initDatabase();
