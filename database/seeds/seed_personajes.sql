-- =============================================================================
-- Los 8 personajes de la matriz de estímulos (Vía B, tarea B2; §4.1 del documento)
-- =============================================================================
-- La matriz cruza 4 perfiles de edad × 2 géneros. Ese equilibrio es el diseño del
-- experimento, no una casualidad de la carga: el bloque final lo comprueba.
--
-- Los personajes viejos NO se borran. Hay 47 decisiones ya grabadas que los
-- referencian por clave ajena, y borrarlos perdería datos recogidos o rompería la
-- integridad. Se distinguen porque las filas nuevas son las únicas con `slug`, y es
-- por ahí por donde el simulador elige el pool (`WHERE slug IS NOT NULL`).
--
-- Idempotente: ON CONFLICT sobre slug actualiza en lugar de duplicar.
--
-- `imc_representado` se queda en 'no_aplica': la matriz nueva del documento no
-- representa complexión, y hacerlo introduciría una variable que nadie pidió.
-- =============================================================================

INSERT INTO personajes
  (slug, nombre, tipo, perfil_edad, edad_rango, sexo, pronombre, imc_representado, imagen)
VALUES
  ('santi',   'Santi',   'nino',         'Niño',         '7-9',   'M', 'él',   'no_aplica', 'assets/characters/santi.webp'),
  ('sofia',   'Sofía',   'nino',         'Niña',         '7-9',   'F', 'ella', 'no_aplica', 'assets/characters/sofia.webp'),
  ('mateo',   'Mateo',   'joven',        'Joven',        '14-16', 'M', 'él',   'no_aplica', 'assets/characters/mateo.webp'),
  ('valeria', 'Valeria', 'joven',        'Joven',        '14-16', 'F', 'ella', 'no_aplica', 'assets/characters/valeria.webp'),
  ('carlos',  'Carlos',  'adulto',       'Adulto',       '30-40', 'M', 'él',   'no_aplica', 'assets/characters/carlos.webp'),
  ('elena',   'Elena',   'adulto',       'Adulto',       '30-40', 'F', 'ella', 'no_aplica', 'assets/characters/elena.webp'),
  ('juan',    'Juan',    'adulto_mayor', 'Adulto Mayor', '70-75', 'M', 'él',   'no_aplica', 'assets/characters/juan.webp'),
  ('maria',   'María',   'adulto_mayor', 'Adulto Mayor', '70-75', 'F', 'ella', 'no_aplica', 'assets/characters/maria.webp')
ON CONFLICT (slug) DO UPDATE SET
  nombre           = EXCLUDED.nombre,
  tipo             = EXCLUDED.tipo,
  perfil_edad      = EXCLUDED.perfil_edad,
  edad_rango       = EXCLUDED.edad_rango,
  sexo             = EXCLUDED.sexo,
  pronombre        = EXCLUDED.pronombre,
  imc_representado = EXCLUDED.imc_representado,
  imagen           = EXCLUDED.imagen;

DO $$
DECLARE
  n_pool    INTEGER;
  n_hombres INTEGER;
  n_mujeres INTEGER;
  n_perfil  INTEGER;
BEGIN
  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE sexo = 'M'),
         COUNT(*) FILTER (WHERE sexo = 'F'),
         COUNT(DISTINCT tipo)
    INTO n_pool, n_hombres, n_mujeres, n_perfil
    FROM personajes
   WHERE slug IS NOT NULL;

  IF n_pool <> 8 THEN
    RAISE EXCEPTION 'El pool tiene % personajes y la matriz de la §4.1 pide 8', n_pool;
  END IF;

  IF n_hombres <> 4 OR n_mujeres <> 4 THEN
    RAISE EXCEPTION 'Matriz desequilibrada: % hombres y % mujeres, se esperaban 4 y 4', n_hombres, n_mujeres;
  END IF;

  IF n_perfil <> 4 THEN
    RAISE EXCEPTION 'Hay % perfiles de edad y la matriz pide 4', n_perfil;
  END IF;

  RAISE NOTICE 'Pool verificado: 8 personajes, 4 perfiles × 2 géneros.';
END
$$;
