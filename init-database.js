// Script para inicializar la base de datos
// Este script solo debe ejecutarse manualmente cuando se necesite
// resetear o crear la estructura de la base de datos por primera vez

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/sirve_la_mesa',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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
    
    const sqlFiles = [
      'database/schema.sql',
      'database/participantes.sql',
      'database/sesiones_juego.sql',
      'database/decisiones_porcionamiento.sql',
      'database/seed_data.sql'
    ];

    console.log('📂 Archivos SQL a ejecutar:');
    sqlFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

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
