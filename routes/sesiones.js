const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
  // POST /api/sesiones - Iniciar nueva sesión de juego
  router.post('/', async (req, res) => {
    try {
      const { participante_id, dispositivo, navegador, resolucion_pantalla } = req.body;

      if (!participante_id) {
        return res.status(400).json({ 
          error: 'El ID del participante es obligatorio' 
        });
      }

      // Verificar que el participante existe
      const participante = await gameController.obtenerParticipante(participante_id);
      if (!participante) {
        return res.status(404).json({ 
          error: 'Participante no encontrado' 
        });
      }

      const sesion = await gameController.iniciarSesion(participante_id, {
        dispositivo,
        navegador,
        resolucion_pantalla
      });

      res.status(201).json({
        success: true,
        data: sesion,
        message: 'Sesión iniciada exitosamente'
      });
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      res.status(500).json({ 
        error: 'Error al iniciar la sesión',
        details: err.message 
      });
    }
  });

  // PUT /api/sesiones/:id - Finalizar sesión
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, notas } = req.body;

      // Validar estado
      const estadosValidos = ['completada', 'abandonada'];
      if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: `El estado debe ser uno de: ${estadosValidos.join(', ')}` 
        });
      }

      const sesion = await gameController.finalizarSesion(
        id, 
        estado || 'completada', 
        notas
      );

      if (!sesion) {
        return res.status(404).json({ 
          error: 'Sesión no encontrada' 
        });
      }

      res.json({
        success: true,
        data: sesion,
        message: 'Sesión finalizada exitosamente'
      });
    } catch (err) {
      console.error('Error al finalizar sesión:', err);
      res.status(500).json({ 
        error: 'Error al finalizar la sesión',
        details: err.message 
      });
    }
  });

  // GET /api/sesiones/:id - Obtener datos de una sesión
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const sesion = await gameController.obtenerSesion(id);

      if (!sesion) {
        return res.status(404).json({ 
          error: 'Sesión no encontrada' 
        });
      }

      res.json({
        success: true,
        data: sesion
      });
    } catch (err) {
      console.error('Error al obtener sesión:', err);
      res.status(500).json({ 
        error: 'Error al obtener la sesión',
        details: err.message 
      });
    }
  });

  // GET /api/sesiones/:id/decisiones - Obtener todas las decisiones de una sesión
  router.get('/:id/decisiones', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que la sesión existe
      const sesion = await gameController.obtenerSesion(id);
      if (!sesion) {
        return res.status(404).json({ 
          error: 'Sesión no encontrada' 
        });
      }

      const decisiones = await gameController.obtenerDecisionesDeSesion(id);

      res.json({
        success: true,
        data: {
          sesion,
          decisiones,
          total_decisiones: decisiones.length
        }
      });
    } catch (err) {
      console.error('Error al obtener decisiones:', err);
      res.status(500).json({ 
        error: 'Error al obtener las decisiones',
        details: err.message 
      });
    }
  });

  return router;
};

