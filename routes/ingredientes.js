const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
  // GET /api/ingredientes - Obtener todos los ingredientes
  router.get('/', async (req, res) => {
    try {
      const { categoria } = req.query;
      
      let ingredientes;
      if (categoria) {
        ingredientes = await gameController.obtenerIngredientesPorCategoria(categoria);
      } else {
        ingredientes = await gameController.obtenerIngredientes();
      }

      res.json({
        success: true,
        data: ingredientes
      });
    } catch (err) {
      console.error('Error al obtener ingredientes:', err);
      res.status(500).json({ 
        error: 'Error al obtener ingredientes',
        details: err.message 
      });
    }
  });

  // GET /api/ingredientes/:id - Obtener un ingrediente específico
  router.get('/:id', async (req, res) => {
    try {
      const ingrediente = await gameController.obtenerIngrediente(req.params.id);
      
      if (!ingrediente) {
        return res.status(404).json({ 
          error: 'Ingrediente no encontrado' 
        });
      }

      res.json({
        success: true,
        data: ingrediente
      });
    } catch (err) {
      console.error('Error al obtener ingrediente:', err);
      res.status(500).json({ 
        error: 'Error al obtener ingrediente',
        details: err.message 
      });
    }
  });

  return router;
};

