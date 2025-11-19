const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
  // POST /api/decisiones - Registrar una decisión de porcionamiento
  router.post('/', async (req, res) => {
    try {
      const {
        sesion_id, escenario,
        personaje_tipo, personaje_edad_rango, personaje_sexo,
        plato_id, bebida_id,
        componentes_servidos,
        tiempo_decision_ms, orden_servicio,
        notas
      } = req.body;

      // Validaciones básicas
      if (!sesion_id) {
        return res.status(400).json({ 
          error: 'El ID de sesión es obligatorio' 
        });
      }

      if (!escenario || !['desayuno', 'almuerzo', 'cena'].includes(escenario)) {
        return res.status(400).json({ 
          error: 'El escenario debe ser: desayuno, almuerzo o cena' 
        });
      }

      if (!personaje_tipo) {
        return res.status(400).json({ 
          error: 'El tipo de personaje es obligatorio' 
        });
      }

      if (!componentes_servidos || !Array.isArray(componentes_servidos)) {
        return res.status(400).json({ 
          error: 'Los componentes servidos deben ser un arreglo' 
        });
      }

      if (componentes_servidos.length === 0) {
        return res.status(400).json({ 
          error: 'Debe incluir al menos un componente servido' 
        });
      }

      // Verificar que la sesión existe
      const sesion = await gameController.obtenerSesion(sesion_id);
      if (!sesion) {
        return res.status(404).json({ 
          error: 'Sesión no encontrada' 
        });
      }

      const decision = await gameController.registrarDecision(req.body);

      res.status(201).json({
        success: true,
        data: decision,
        message: 'Decisión registrada exitosamente'
      });
    } catch (err) {
      console.error('Error al registrar decisión:', err);
      res.status(500).json({ 
        error: 'Error al registrar la decisión',
        details: err.message 
      });
    }
  });

  // POST /api/decisiones/batch - Registrar múltiples decisiones en lote
  router.post('/batch', async (req, res) => {
    try {
      const { decisiones } = req.body;

      if (!decisiones || !Array.isArray(decisiones)) {
        return res.status(400).json({ 
          error: 'Se espera un arreglo de decisiones' 
        });
      }

      if (decisiones.length === 0) {
        return res.status(400).json({ 
          error: 'El arreglo de decisiones no puede estar vacío' 
        });
      }

      // Validación básica de cada decisión
      for (let i = 0; i < decisiones.length; i++) {
        const d = decisiones[i];
        if (!d.sesion_id || !d.escenario || !d.personaje_tipo || !d.componentes_servidos) {
          return res.status(400).json({ 
            error: `Decisión en índice ${i} tiene campos faltantes` 
          });
        }
      }

      const resultados = await gameController.registrarDecisionesBatch(decisiones);

      res.status(201).json({
        success: true,
        data: resultados,
        total: resultados.length,
        message: `${resultados.length} decisiones registradas exitosamente`
      });
    } catch (err) {
      console.error('Error al registrar decisiones en lote:', err);
      res.status(500).json({ 
        error: 'Error al registrar las decisiones',
        details: err.message 
      });
    }
  });

  return router;
};

