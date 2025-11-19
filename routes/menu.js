const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
  // GET /api/menu - Obtener todos los menús
  router.get('/', async (req, res) => {
    try {
      const menus = await gameController.obtenerMenus();

      res.json({
        success: true,
        data: menus,
        total: menus.length
      });
    } catch (err) {
      console.error('Error al obtener menús:', err);
      res.status(500).json({ 
        error: 'Error al obtener los menús',
        details: err.message 
      });
    }
  });

  // GET /api/menu/platos/:menu_id - Obtener platos de un menú específico
  router.get('/platos/:menu_id', async (req, res) => {
    try {
      const { menu_id } = req.params;
      const platos = await gameController.obtenerPlatosDeMenu(menu_id);

      res.json({
        success: true,
        data: platos,
        total: platos.length
      });
    } catch (err) {
      console.error('Error al obtener platos:', err);
      res.status(500).json({ 
        error: 'Error al obtener los platos',
        details: err.message 
      });
    }
  });

  // GET /api/menu/componentes/:plato_id - Obtener componentes de un plato
  router.get('/componentes/:plato_id', async (req, res) => {
    try {
      const { plato_id } = req.params;
      const componentes = await gameController.obtenerComponentesDePlato(plato_id);

      res.json({
        success: true,
        data: componentes,
        total: componentes.length
      });
    } catch (err) {
      console.error('Error al obtener componentes:', err);
      res.status(500).json({ 
        error: 'Error al obtener los componentes',
        details: err.message 
      });
    }
  });

  // GET /api/menu/bebidas - Obtener todas las bebidas
  router.get('/bebidas', async (req, res) => {
    try {
      const bebidas = await gameController.obtenerBebidas();

      res.json({
        success: true,
        data: bebidas,
        total: bebidas.length
      });
    } catch (err) {
      console.error('Error al obtener bebidas:', err);
      res.status(500).json({ 
        error: 'Error al obtener las bebidas',
        details: err.message 
      });
    }
  });

  // GET /api/menu/bebidas/:menu_id - Obtener bebidas de un menú específico
  router.get('/bebidas/:menu_id', async (req, res) => {
    try {
      const { menu_id } = req.params;
      const bebidas = await gameController.obtenerBebidasDeMenu(menu_id);

      res.json({
        success: true,
        data: bebidas,
        total: bebidas.length
      });
    } catch (err) {
      console.error('Error al obtener bebidas del menú:', err);
      res.status(500).json({ 
        error: 'Error al obtener las bebidas del menú',
        details: err.message 
      });
    }
  });

  return router;
};

