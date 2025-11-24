// Controlador para la lógica de negocio del juego
const { Pool } = require('pg');

class GameDataController {
  constructor(pool) {
    this.pool = pool;
  }

  // ===================================
  // PARTICIPANTES
  // ===================================
  
  async crearParticipante(datos) {
    const {
      nombres, edad, sexo,
      peso_kg, altura_cm,
      lugar_nacimiento, lugar_residencia,
      ocupacion, nivel_socioeconomico,
      eat26_score, eat26_data,
      consentimiento_informado, notas
    } = datos;

    // Calcular IMC
    const imc = peso_kg && altura_cm ? 
      (peso_kg / Math.pow(altura_cm / 100, 2)).toFixed(2) : null;

    const query = `
      INSERT INTO Participantes (
        nombres, edad, sexo, peso_kg, altura_cm, imc,
        lugar_nacimiento, lugar_residencia,
        ocupacion, nivel_socioeconomico,
        eat26_score, eat26_data,
        consentimiento_informado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      nombres, edad, sexo, peso_kg, altura_cm, imc,
      lugar_nacimiento, lugar_residencia,
      ocupacion, nivel_socioeconomico,
      eat26_score, eat26_data ? JSON.stringify(eat26_data) : null,
      consentimiento_informado, notas
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async obtenerParticipante(id) {
    const query = 'SELECT * FROM Participantes WHERE PK_participante = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  // ===================================
  // SESIONES
  // ===================================

  async iniciarSesion(participanteId, metadata = {}) {
    const { dispositivo, navegador, resolucion_pantalla } = metadata;

    const query = `
      INSERT INTO Sesiones_juego (
        FK_participante, dispositivo, navegador, resolucion_pantalla
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      participanteId, dispositivo, navegador, resolucion_pantalla
    ]);

    return result.rows[0];
  }

  async finalizarSesion(sesionId, estado = 'completada', notas = null) {
    const query = `
      UPDATE Sesiones_juego 
      SET fecha_fin = CURRENT_TIMESTAMP, estado = $1, notas = $2
      WHERE PK_sesion = $3
      RETURNING *
    `;

    const result = await this.pool.query(query, [estado, notas, sesionId]);
    return result.rows[0];
  }

  async obtenerSesion(sesionId) {
    const query = 'SELECT * FROM Sesiones_juego WHERE PK_sesion = $1';
    const result = await this.pool.query(query, [sesionId]);
    return result.rows[0];
  }

  // ===================================
  // PERSONAJES
  // ===================================

  async obtenerPersonajes() {
    const query = 'SELECT * FROM Personajes ORDER BY PK_personaje';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async obtenerPersonaje(id) {
    const query = 'SELECT * FROM Personajes WHERE PK_personaje = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  // ===================================
  // INGREDIENTES (COMPONENTES)
  // ===================================

  async obtenerIngredientes() {
    const query = 'SELECT * FROM Componentes ORDER BY categoria, nombre';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async obtenerIngredientesPorCategoria(categoria) {
    const query = 'SELECT * FROM Componentes WHERE categoria = $1 ORDER BY nombre';
    const result = await this.pool.query(query, [categoria]);
    return result.rows;
  }

  async obtenerIngrediente(id) {
    const query = 'SELECT * FROM Componentes WHERE PK_alimento = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  // ===================================
  // MENÚ
  // ===================================

  async obtenerMenus() {
    const query = 'SELECT * FROM Menu ORDER BY nombre';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async obtenerPlatosDeMenu(menuId) {
    const query = `
      SELECT p.*
      FROM Plato p
      INNER JOIN Menu_plato mp ON p.PK_plato = mp.FK_plato
      WHERE mp.FK_menu = $1
      ORDER BY p.nombre
    `;
    const result = await this.pool.query(query, [menuId]);
    return result.rows;
  }

  async obtenerComponentesDePlato(platoId) {
    const query = `
      SELECT c.*, p.cantidad, p.unidad_medida
      FROM Componentes c
      INNER JOIN Porcion p ON c.PK_alimento = p.FK_alimento
      WHERE p.FK_plato = $1
      ORDER BY c.nombre
    `;
    const result = await this.pool.query(query, [platoId]);
    return result.rows;
  }

  async obtenerBebidas() {
    const query = 'SELECT * FROM Bebida ORDER BY nombre';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async obtenerBebidasDeMenu(menuId) {
    const query = `
      SELECT b.*
      FROM Bebida b
      INNER JOIN Menu_bebida mb ON b.PK_bebida = mb.FK_bebida
      WHERE mb.FK_menu = $1
      ORDER BY b.nombre
    `;
    const result = await this.pool.query(query, [menuId]);
    return result.rows;
  }

  // ===================================
  // DECISIONES DE PORCIONAMIENTO
  // ===================================

  async registrarDecision(datos) {
    const {
      sesion_id, escenario,
      personaje_tipo, personaje_edad_rango, personaje_sexo,
      plato_id, bebida_id,
      componentes_servidos,
      tiempo_decision_ms, orden_servicio,
      notas
    } = datos;

    // Calcular cantidad total
    let cantidad_total = 0;
    if (Array.isArray(componentes_servidos)) {
      cantidad_total = componentes_servidos.reduce((sum, comp) => {
        return sum + (parseFloat(comp.cantidad_gramos) || 0);
      }, 0);
    }

    const query = `
      INSERT INTO Decisiones_porcionamiento (
        FK_sesion, escenario,
        personaje_tipo, personaje_edad_rango, personaje_sexo,
        FK_plato, FK_bebida,
        componentes_servidos, cantidad_total_gramos,
        tiempo_decision_ms, orden_servicio, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      sesion_id, escenario,
      personaje_tipo, personaje_edad_rango, personaje_sexo,
      plato_id, bebida_id,
      JSON.stringify(componentes_servidos), cantidad_total,
      tiempo_decision_ms, orden_servicio, notas
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async registrarDecisionesBatch(decisiones) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const resultados = [];
      for (const decision of decisiones) {
        const resultado = await this.registrarDecision(decision);
        resultados.push(resultado);
      }
      
      await client.query('COMMIT');
      return resultados;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async obtenerDecisionesDeSesion(sesionId) {
    const query = `
      SELECT * FROM Decisiones_porcionamiento
      WHERE FK_sesion = $1
      ORDER BY orden_servicio, timestamp_decision
    `;
    const result = await this.pool.query(query, [sesionId]);
    return result.rows;
  }

  // ===================================
  // ESTADÍSTICAS Y ANÁLISIS
  // ===================================

  async obtenerEstadisticasGenerales() {
    const queries = {
      total_participantes: 'SELECT COUNT(*) as total FROM Participantes',
      total_sesiones: 'SELECT COUNT(*) as total FROM Sesiones_juego WHERE estado = \'completada\'',
      total_decisiones: 'SELECT COUNT(*) as total FROM Decisiones_porcionamiento',
      promedio_duracion: 'SELECT AVG(duracion_total_segundos) as promedio FROM Sesiones_juego WHERE duracion_total_segundos IS NOT NULL'
    };

    const stats = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await this.pool.query(query);
      stats[key] = result.rows[0].total || result.rows[0].promedio || 0;
    }

    return stats;
  }

  async obtenerDecisionesPorGenero() {
    const query = `
      SELECT 
        personaje_sexo,
        COUNT(*) as cantidad_decisiones,
        AVG(cantidad_total_gramos) as promedio_gramos,
        SUM(cantidad_total_gramos) as total_gramos
      FROM Decisiones_porcionamiento
      WHERE personaje_sexo IS NOT NULL
      GROUP BY personaje_sexo
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  async obtenerDecisionesPorEdad() {
    const query = `
      SELECT 
        personaje_edad_rango,
        COUNT(*) as cantidad_decisiones,
        AVG(cantidad_total_gramos) as promedio_gramos,
        SUM(cantidad_total_gramos) as total_gramos
      FROM Decisiones_porcionamiento
      WHERE personaje_edad_rango IS NOT NULL
      GROUP BY personaje_edad_rango
      ORDER BY personaje_edad_rango
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
}

module.exports = GameDataController;

