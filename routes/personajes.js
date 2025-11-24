const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
  // GET /api/personajes - Obtener todos los personajes sintéticos
  router.get('/', async (req, res) => {
    try {
      const personajes = await gameController.obtenerPersonajes();
      res.json({
        success: true,
        data: personajes
      });
    } catch (err) {
      console.error('Error al obtener personajes:', err);
      res.status(500).json({ 
        error: 'Error al obtener personajes',
        details: err.message 
      });
    }
  });

  // GET /api/personajes/:id - Obtener un personaje específico
  router.get('/:id', async (req, res) => {
    try {
      const personaje = await gameController.obtenerPersonaje(req.params.id);
      
      if (!personaje) {
        return res.status(404).json({ 
          error: 'Personaje no encontrado' 
        });
      }

      res.json({
        success: true,
        data: personaje
      });
    } catch (err) {
      console.error('Error al obtener personaje:', err);
      res.status(500).json({ 
        error: 'Error al obtener personaje',
        details: err.message 
      });
    }
  });

  return router;
};

