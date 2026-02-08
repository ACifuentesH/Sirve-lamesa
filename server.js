require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const socketIO = require('socket.io');

const GameDataController = require('./controllers/gameDataController');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const port = process.env.PORT || 3000;

// ===================================
// CONFIGURACIÓN DE MIDDLEWARES
// ===================================

// CORS configurado para aceptar peticiones desde Godot (web y local)
app.use(cors({
  origin: function(origin, callback) {
    // Permitir peticiones sin origin (como apps de escritorio de Godot)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      '*' // En desarrollo, permitir todos
    ].filter(Boolean);
    
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static('public'));

// Servir aplicación Angular en producción
if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos de Angular
  app.use(express.static(path.join(__dirname, 'angular-app/dist/sirve-la-mesa')));
} else {
  // En desarrollo, el proxy de Angular maneja las rutas
  console.log('En modo desarrollo, usar ng serve en puerto 4200');
}

// ===================================
// CONFIGURACIÓN DE BASE DE DATOS
// ===================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/sirve_la_mesa',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Instancia del controlador
const gameController = new GameDataController(pool);

// ===================================
// INICIALIZACIÓN DE BASE DE DATOS
// ===================================

async function initDatabase() {
  try {
    console.log('Inicializando base de datos...');
    
    const sqlFiles = [
      'database/schema.sql',
      'database/participantes.sql',
      'database/sesiones_juego.sql',
      'database/decisiones_porcionamiento.sql',
      'database/seed_data.sql'
    ];

    for (const file of sqlFiles) {
      try {
        const filePath = path.join(__dirname, file);
        const sql = await fs.readFile(filePath, 'utf8');
        await pool.query(sql);
        console.log(`✓ Ejecutado: ${file}`);
      } catch (err) {
        console.error(`✗ Error en ${file}:`, err.message);
        // Continuar con los demás archivos incluso si uno falla
      }
    }
    
    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error general al inicializar la base de datos:', err);
  }
}

// ===================================
// RUTAS DE LA API
// ===================================

// Importar y usar las rutas
const participantesRoutes = require('./routes/participantes')(gameController);
const sesionesRoutes = require('./routes/sesiones')(gameController);
const menuRoutes = require('./routes/menu')(gameController);
const decisionesRoutes = require('./routes/decisiones')(gameController);
const personajesRoutes = require('./routes/personajes')(gameController);
const ingredientesRoutes = require('./routes/ingredientes')(gameController);

app.use('/api/participantes', participantesRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/decisiones', decisionesRoutes);
app.use('/api/personajes', personajesRoutes);
app.use('/api/ingredientes', ingredientesRoutes);

// ===================================
// ENDPOINTS DE SISTEMA
// ===================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test de conexión a base de datos
app.get('/api/test-connection', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now, version() as version');
    res.json({ 
      status: 'OK',
      connection: 'Successful',
      timestamp: result.rows[0].now,
      database_version: result.rows[0].version
    });
  } catch (err) {
    console.error('Error de conexión:', err);
    res.status(500).json({ 
      status: 'ERROR',
      connection: 'Failed',
      error: err.message 
    });
  }
});

// ===================================
// RUTAS DE ESTADÍSTICAS (para admin)
// ===================================

app.get('/api/estadisticas/generales', async (req, res) => {
  try {
    const stats = await gameController.obtenerEstadisticasGenerales();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: err.message 
    });
  }
});

app.get('/api/estadisticas/por-genero', async (req, res) => {
  try {
    const stats = await gameController.obtenerDecisionesPorGenero();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error al obtener estadísticas por género:', err);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas por género',
      details: err.message 
    });
  }
});

app.get('/api/estadisticas/por-edad', async (req, res) => {
  try {
    const stats = await gameController.obtenerDecisionesPorEdad();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error al obtener estadísticas por edad:', err);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas por edad',
      details: err.message 
    });
  }
});

// ===================================
// EXPORTACIÓN DE DATOS
// ===================================

app.get('/api/exportar/csv', async (req, res) => {
  try {
    const datos = await gameController.exportarDatosCompletos();
    const csv = gameController.generarCSV(datos);

    if (!csv) {
      return res.status(404).json({
        error: 'No hay datos para exportar'
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `sirve-la-mesa_datos_${fecha}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(csv);
  } catch (err) {
    console.error('Error al exportar datos CSV:', err);
    res.status(500).json({
      error: 'Error al exportar datos',
      details: err.message
    });
  }
});

app.get('/api/exportar/json', async (req, res) => {
  try {
    const datos = await gameController.exportarDatosCompletos();

    if (!datos || datos.length === 0) {
      return res.status(404).json({
        error: 'No hay datos para exportar'
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `sirve-la-mesa_datos_${fecha}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.json({
      success: true,
      exportado_en: new Date().toISOString(),
      total_registros: datos.length,
      data: datos
    });
  } catch (err) {
    console.error('Error al exportar datos JSON:', err);
    res.status(500).json({
      error: 'Error al exportar datos',
      details: err.message
    });
  }
});

// ===================================
// RUTAS DE PÁGINAS WEB
// ===================================

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Panel administrativo
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Página del juego
app.get('/juego', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game', 'index.html'));
});

// ===================================
// WEBSOCKET (OPCIONAL - TIEMPO REAL)
// ===================================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('sesion:progreso', (data) => {
    // Broadcast de progreso a otros clientes (ej: dashboard admin)
    socket.broadcast.emit('sesion:actualizada', data);
  });

  socket.on('decision:registrada', (data) => {
    // Notificar que se registró una decisión
    socket.broadcast.emit('decision:nueva', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// ===================================
// MANEJO DE ERRORES 404 y SPA
// ===================================

// En producción, servir index.html de Angular para todas las rutas no-API
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'angular-app/dist/sirve-la-mesa/index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ 
      error: 'Ruta no encontrada',
      path: req.path 
    });
  });
}

// ===================================
// INICIAR SERVIDOR
// ===================================

server.listen(port, async () => {
  console.log('='.repeat(50));
  console.log(`🎮 Servidor "Sirve la Mesa" iniciado`);
  console.log(`📡 Puerto: ${port}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log('='.repeat(50));
  
  await initDatabase(); 
  
  console.log('\n📚 Endpoints disponibles:');
  console.log('  - GET  /api/health');
  console.log('  - GET  /api/test-connection');
  console.log('  - POST /api/participantes');
  console.log('  - POST /api/sesiones');
  console.log('  - GET  /api/menu');
  console.log('  - GET  /api/personajes');
  console.log('  - GET  /api/ingredientes');
  console.log('  - POST /api/decisiones');
  console.log('  - GET  /api/exportar/csv');
  console.log('  - GET  /api/exportar/json');
  console.log('  - GET  /admin');
  console.log('  - GET  /juego');
  console.log('');
});

// ===================================
// MANEJO DE CIERRE GRACEFUL
// ===================================

process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  
  await pool.end();
  console.log('✓ Conexión a base de datos cerrada');
  
  server.close(() => {
    console.log('✓ Servidor HTTP cerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Señal SIGTERM recibida, cerrando servidor...');
  
  await pool.end();
  server.close(() => {
    process.exit(0);
  });
});
