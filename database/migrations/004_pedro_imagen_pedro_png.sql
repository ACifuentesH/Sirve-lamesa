-- Corregir retrato de Pedro si la BD aún tenía la ruta antigua (antes de pedro.png en assets/images/).
UPDATE personajes
SET imagen = 'pedro.png'
WHERE nombre = 'Pedro'
   OR imagen IN ('ingredientes/nino.png', 'ingredientes/niño.png');
