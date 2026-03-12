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
      edad, sexo,
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
        edad, sexo, peso_kg, altura_cm, imc,
        lugar_nacimiento, lugar_residencia,
        ocupacion, nivel_socioeconomico,
        eat26_score, eat26_data,
        consentimiento_informado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      edad, sexo, peso_kg, altura_cm, imc,
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

  // ===================================
  // EXPORTACIÓN DE DATOS COMPLETOS
  // ===================================

  async exportarDatosCompletos() {
    // Obtener todas las decisiones con info del participante y sesión
    const query = `
      SELECT 
        p.pk_participante,
        p.edad AS participante_edad,
        p.sexo AS participante_sexo,
        p.peso_kg AS participante_peso_kg,
        p.altura_cm AS participante_altura_cm,
        p.imc AS participante_imc,
        p.lugar_nacimiento AS participante_lugar_nacimiento,
        p.lugar_residencia AS participante_lugar_residencia,
        p.ocupacion AS participante_ocupacion,
        p.nivel_socioeconomico AS participante_nivel_socioeconomico,
        p.eat26_score AS participante_eat26_score,
        p.fecha_registro AS participante_fecha_registro,
        s.pk_sesion,
        s.fecha_inicio AS sesion_fecha_inicio,
        s.fecha_fin AS sesion_fecha_fin,
        s.duracion_total_segundos AS sesion_duracion_segundos,
        s.estado AS sesion_estado,
        d.pk_decision,
        d.escenario,
        d.personaje_tipo,
        d.personaje_edad_rango,
        d.personaje_sexo,
        d.componentes_servidos,
        d.cantidad_total_gramos,
        d.tiempo_decision_ms,
        d.orden_servicio,
        d.timestamp_decision
      FROM Decisiones_porcionamiento d
      INNER JOIN Sesiones_juego s ON d.fk_sesion = s.pk_sesion
      INNER JOIN Participantes p ON s.fk_participante = p.pk_participante
      ORDER BY p.pk_participante, s.pk_sesion, d.orden_servicio
    `;

    const result = await this.pool.query(query);

    // Obtener catálogo de componentes para mapear categorías
    const componentesResult = await this.pool.query(
      'SELECT pk_alimento, nombre, categoria, unidad FROM Componentes'
    );
    const componentesMap = {};
    for (const comp of componentesResult.rows) {
      componentesMap[comp.pk_alimento] = comp;
      // También mapear por nombre (lowercase) como fallback
      componentesMap[comp.nombre.toLowerCase()] = comp;
    }

    // Categorías de alimentos
    const categorias = ['proteina', 'carbohidrato', 'vegetal', 'fruta', 'salsa'];

    // Procesar cada fila para organizar componentes por categoría
    const datosExportados = result.rows.map(row => {
      const componentes = row.componentes_servidos || [];
      
      // Agrupar componentes por categoría
      const porCategoria = {};
      for (const cat of categorias) {
        porCategoria[cat] = [];
      }
      porCategoria['otro'] = [];

      for (const comp of componentes) {
        // Buscar categoría: primero por ID, luego por nombre
        let categoria = 'otro';
        if (comp.componente_id && componentesMap[comp.componente_id]) {
          categoria = componentesMap[comp.componente_id].categoria || 'otro';
        } else if (comp.nombre && componentesMap[comp.nombre.toLowerCase()]) {
          categoria = componentesMap[comp.nombre.toLowerCase()].categoria || 'otro';
        }

        const unidad = comp.unidad || 'g';
        const cantidad = comp.cantidad_gramos || 0;
        const texto = `${comp.nombre} (${cantidad}${unidad})`;

        if (porCategoria[categoria]) {
          porCategoria[categoria].push(texto);
        } else {
          porCategoria['otro'].push(texto);
        }
      }

      return {
        // Participante
        participante_id: row.pk_participante,
        participante_edad: row.participante_edad,
        participante_sexo: row.participante_sexo,
        participante_peso_kg: row.participante_peso_kg || '',
        participante_altura_cm: row.participante_altura_cm || '',
        participante_imc: row.participante_imc || '',
        participante_lugar_nacimiento: row.participante_lugar_nacimiento || '',
        participante_lugar_residencia: row.participante_lugar_residencia || '',
        participante_ocupacion: row.participante_ocupacion || '',
        participante_nivel_socioeconomico: row.participante_nivel_socioeconomico || '',
        participante_eat26_score: row.participante_eat26_score || '',
        participante_fecha_registro: row.participante_fecha_registro || '',
        // Sesión
        sesion_id: row.pk_sesion,
        sesion_fecha_inicio: row.sesion_fecha_inicio || '',
        sesion_fecha_fin: row.sesion_fecha_fin || '',
        sesion_duracion_segundos: row.sesion_duracion_segundos || '',
        sesion_estado: row.sesion_estado || '',
        // Decisión
        decision_id: row.pk_decision,
        escenario: row.escenario,
        personaje_tipo: row.personaje_tipo,
        personaje_edad_rango: row.personaje_edad_rango || '',
        personaje_sexo: row.personaje_sexo || '',
        orden_servicio: row.orden_servicio || '',
        tiempo_decision_ms: row.tiempo_decision_ms || '',
        cantidad_total_gramos: row.cantidad_total_gramos || '',
        timestamp_decision: row.timestamp_decision || '',
        // Porciones por categoría
        proteinas: porCategoria['proteina'].join(', ') || '',
        carbohidratos: porCategoria['carbohidrato'].join(', ') || '',
        vegetales: porCategoria['vegetal'].join(', ') || '',
        frutas: porCategoria['fruta'].join(', ') || '',
        salsas: porCategoria['salsa'].join(', ') || '',
        otros: porCategoria['otro'].join(', ') || ''
      };
    });

    return datosExportados;
  }

  generarCSV(datos) {
    if (!datos || datos.length === 0) {
      return '';
    }

    // Encabezados legibles
    const encabezados = {
      participante_id: 'ID Participante',
      participante_edad: 'Edad Participante',
      participante_sexo: 'Sexo Participante',
      participante_peso_kg: 'Peso (kg)',
      participante_altura_cm: 'Altura (cm)',
      participante_imc: 'IMC',
      participante_lugar_nacimiento: 'Lugar de Nacimiento',
      participante_lugar_residencia: 'Lugar de Residencia',
      participante_ocupacion: 'Ocupación',
      participante_nivel_socioeconomico: 'Nivel Socioeconómico',
      participante_eat26_score: 'EAT-26 Score',
      participante_fecha_registro: 'Fecha Registro Participante',
      sesion_id: 'ID Sesión',
      sesion_fecha_inicio: 'Fecha Inicio Sesión',
      sesion_fecha_fin: 'Fecha Fin Sesión',
      sesion_duracion_segundos: 'Duración Sesión (seg)',
      sesion_estado: 'Estado Sesión',
      decision_id: 'ID Decisión',
      escenario: 'Escenario',
      personaje_tipo: 'Tipo Personaje (Sujeto Servido)',
      personaje_edad_rango: 'Rango Edad Personaje',
      personaje_sexo: 'Sexo Personaje',
      orden_servicio: 'Orden de Servicio',
      tiempo_decision_ms: 'Tiempo Decisión (ms)',
      cantidad_total_gramos: 'Cantidad Total (g)',
      timestamp_decision: 'Timestamp Decisión',
      proteinas: 'Proteínas',
      carbohidratos: 'Carbohidratos',
      vegetales: 'Vegetales',
      frutas: 'Frutas',
      salsas: 'Salsas/Aderezos',
      otros: 'Otros'
    };

    const campos = Object.keys(encabezados);
    
    // BOM para que Excel reconozca UTF-8
    let csv = '\uFEFF';
    
    // Línea de encabezados
    csv += campos.map(c => `"${encabezados[c]}"`).join(',') + '\n';

    // Filas de datos
    for (const fila of datos) {
      const valores = campos.map(campo => {
        let valor = fila[campo] !== undefined && fila[campo] !== null ? String(fila[campo]) : '';
        // Escapar comillas dobles y envolver en comillas
        valor = valor.replace(/"/g, '""');
        return `"${valor}"`;
      });
      csv += valores.join(',') + '\n';
    }

    return csv;
  }
}

module.exports = GameDataController;

