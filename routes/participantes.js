const express = require('express');
const router = express.Router();

module.exports = (gameController) => {
  // POST /api/participantes - Crear nuevo participante
  router.post('/', async (req, res) => {
    try {
      const {
        edad, sexo,
        peso_kg, altura_cm,
        lugar_nacimiento, lugar_residencia,
        ocupacion, nivel_socioeconomico,
        eat26_score, eat26_data,
        consentimiento_informado, notas
      } = req.body;

      // Validaciones básicas
      if (!edad || !sexo || peso_kg === undefined || altura_cm === undefined) {
        return res.status(400).json({ 
          error: 'Edad, sexo, peso_kg y altura_cm son campos obligatorios'
        });
      }

      if (!['M', 'F', 'Otro'].includes(sexo)) {
        return res.status(400).json({ 
          error: 'El sexo debe ser M, F u Otro' 
        });
      }

      if (edad < 1 || edad > 120) {
        return res.status(400).json({ 
          error: 'La edad debe estar entre 1 y 120 años' 
        });
      }

      if (peso_kg <= 0 || altura_cm <= 0) {
        return res.status(400).json({
          error: 'El peso y la altura deben ser mayores a 0'
        });
      }

      const participante = await gameController.crearParticipante(req.body);
      
      res.status(201).json({
        success: true,
        data: participante,
        message: 'Participante creado exitosamente'
      });
    } catch (err) {
      console.error('Error al crear participante:', err);
      res.status(500).json({ 
        error: 'Error al crear el participante',
        details: err.message 
      });
    }
  });

  // GET /api/participantes/:id - Obtener datos de un participante
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const participante = await gameController.obtenerParticipante(id);

      if (!participante) {
        return res.status(404).json({ 
          error: 'Participante no encontrado' 
        });
      }

      res.json({
        success: true,
        data: participante
      });
    } catch (err) {
      console.error('Error al obtener participante:', err);
      res.status(500).json({ 
        error: 'Error al obtener el participante',
        details: err.message 
      });
    }
  });

  // PUT /api/participantes/:id - Actualizar datos adicionales del participante
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        peso_kg, altura_cm,
        lugar_nacimiento, lugar_residencia,
        ocupacion, nivel_socioeconomico,
        eat26_score, eat26_data,
        notas
      } = req.body;

      // Construir query dinámicamente según los campos proporcionados
      const campos = [];
      const valores = [];
      let indice = 1;

      if (peso_kg !== undefined) {
        campos.push(`peso_kg = $${indice}`);
        valores.push(peso_kg);
        indice++;
      }
      if (altura_cm !== undefined) {
        campos.push(`altura_cm = $${indice}`);
        valores.push(altura_cm);
        indice++;
      }
      if (peso_kg !== undefined && altura_cm !== undefined) {
        const imc = (peso_kg / Math.pow(altura_cm / 100, 2)).toFixed(2);
        campos.push(`imc = $${indice}`);
        valores.push(imc);
        indice++;
      }
      if (lugar_nacimiento !== undefined) {
        campos.push(`lugar_nacimiento = $${indice}`);
        valores.push(lugar_nacimiento);
        indice++;
      }
      if (lugar_residencia !== undefined) {
        campos.push(`lugar_residencia = $${indice}`);
        valores.push(lugar_residencia);
        indice++;
      }
      if (ocupacion !== undefined) {
        campos.push(`ocupacion = $${indice}`);
        valores.push(ocupacion);
        indice++;
      }
      if (nivel_socioeconomico !== undefined) {
        campos.push(`nivel_socioeconomico = $${indice}`);
        valores.push(nivel_socioeconomico);
        indice++;
      }
      if (eat26_score !== undefined) {
        campos.push(`eat26_score = $${indice}`);
        valores.push(eat26_score);
        indice++;
      }
      if (eat26_data !== undefined) {
        campos.push(`eat26_data = $${indice}`);
        valores.push(JSON.stringify(eat26_data));
        indice++;
      }
      if (notas !== undefined) {
        campos.push(`notas = $${indice}`);
        valores.push(notas);
        indice++;
      }

      if (campos.length === 0) {
        return res.status(400).json({ 
          error: 'No se proporcionaron campos para actualizar' 
        });
      }

      // Agregar el ID al final
      valores.push(id);
      const query = `
        UPDATE Participantes 
        SET ${campos.join(', ')} 
        WHERE PK_participante = $${indice}
        RETURNING *
      `;

      const participante = await gameController.pool.query(query, valores);

      if (participante.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Participante no encontrado' 
        });
      }

      res.json({
        success: true,
        data: participante.rows[0],
        message: 'Participante actualizado exitosamente'
      });
    } catch (err) {
      console.error('Error al actualizar participante:', err);
      res.status(500).json({ 
        error: 'Error al actualizar el participante',
        details: err.message 
      });
    }
  });

  return router;
};

