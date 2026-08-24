-- =============================================================================
-- Catálogo de alimentos — 34 filas (Vía B, tarea B2; Anexo B del plan)
-- =============================================================================
-- peso_gramos es el dato que alimenta todo el análisis estadístico y el
-- participante nunca lo ve: un 30 escrito 300 no se nota en la interfaz y
-- invalida el estudio en silencio. Por eso el archivo termina con un bloque que
-- comprueba, contra los totales del Anexo B, tanto el número de filas por momento
-- como la suma de los pesos. Si alguien edita un peso, la carga falla.
--
-- Idempotente: ON CONFLICT sobre (slug, momento_dia) actualiza, así que volver a
-- correrlo corrige valores en lugar de duplicar filas.
--
-- Un mismo alimento aparece con slug distinto en momentos distintos cuando cambia
-- el peso o la preparación (huevo 50 g en desayuno, huevo-cocido 50 g en cena).
-- =============================================================================

INSERT INTO catalogo_alimentos
  (slug, nombre, momento_dia, grupo, tipo, unidad_display, peso_gramos, es_bebida, imagen, orden)
VALUES
  -- MATRIZ A — DESAYUNO (11)
  ('pan-tostado',          'Pan Tostado',                                 'desayuno', 'Carbohidratos y Acompañamientos', 'carbohidrato', '1 rebanada',                        30,  FALSE, 'assets/foods/desayuno/pan-tostado.webp',          1),
  ('arepa-tortilla-maiz',  'Arepa o Tortilla de Maíz',                    'desayuno', 'Carbohidratos y Acompañamientos', 'carbohidrato', '1 unidad mediana',                  50,  FALSE, 'assets/foods/desayuno/arepa-tortilla-maiz.webp',  2),
  ('cereal-hojuelas',      'Cereal de hojuelas',                          'desayuno', 'Carbohidratos y Acompañamientos', 'carbohidrato', '1 porción en tazón',                40,  FALSE, 'assets/foods/desayuno/cereal-hojuelas.webp',      3),
  ('galletas-soda',        'Galletas de soda/integrales',                 'desayuno', 'Carbohidratos y Acompañamientos', 'carbohidrato', '1 paquete (4 galletas)',            24,  FALSE, 'assets/foods/desayuno/galletas-soda.webp',        4),
  ('huevo',                'Huevo (Frito, Revuelto o Cocido)',            'desayuno', 'Proteínas y Lácteos',             'proteina',     '1 unidad',                          50,  FALSE, 'assets/foods/desayuno/huevo.webp',                5),
  ('queso',                'Queso Blanco / Amarillo',                     'desayuno', 'Proteínas y Lácteos',             'lacteo',       '1 rebanada grosor medio',           30,  FALSE, 'assets/foods/desayuno/queso.webp',                6),
  ('jamon',                'Jamón de Pavo / Cerdo',                       'desayuno', 'Proteínas y Lácteos',             'proteina',     '1 rebanada delgada',                20,  FALSE, 'assets/foods/desayuno/jamon.webp',                7),
  ('yogur',                'Yogur Natural / Frutos Rojos',                'desayuno', 'Proteínas y Lácteos',             'lacteo',       '1 envase pequeño',                  125, FALSE, 'assets/foods/desayuno/yogur.webp',                8),
  ('fruta-rodajas',        'Fruta en rodajas (Manzana, Banano o Melón)',  'desayuno', 'Frutas y Elementos Frescos',      'fruta',        '1 porción',                         40,  FALSE, 'assets/foods/desayuno/fruta-rodajas.webp',        9),
  ('cafe-leche',           'Taza de Café con Leche / Negro',              'desayuno', 'Bebidas',                         'bebida',       '1 taza',                            200, TRUE,  'assets/foods/desayuno/cafe-leche.webp',           10),
  ('jugo-naranja',         'Vaso de Jugo de Naranja',                     'desayuno', 'Bebidas',                         'bebida',       '1 vaso',                            250, TRUE,  'assets/foods/desayuno/jugo-naranja.webp',         11),

  -- MATRIZ B — ALMUERZO (12)
  ('arroz',                'Arroz Blanco o Integral',                     'almuerzo', 'Carbohidratos y Acompañamientos', 'carbohidrato', '1 cucharada de servicio (cucharón)', 60,  FALSE, 'assets/foods/almuerzo/arroz.webp',               1),
  ('pasta',                'Pasta / Espagueti',                           'almuerzo', 'Carbohidratos y Acompañamientos', 'carbohidrato', '1 porción mediana de servicio',      70,  FALSE, 'assets/foods/almuerzo/pasta.webp',               2),
  ('papa',                 'Puré de Papa o Papas Cocidas',                'almuerzo', 'Carbohidratos y Acompañamientos', 'carbohidrato', '1 porción / 1 papa mediana',         80,  FALSE, 'assets/foods/almuerzo/papa.webp',                3),
  ('platano-maduro',       'Plátano Maduro (Horneado o Frito)',           'almuerzo', 'Carbohidratos y Acompañamientos', 'carbohidrato', '2 tajadas/rodajas',                  40,  FALSE, 'assets/foods/almuerzo/platano-maduro.webp',      4),
  ('pechuga-pollo',        'Pechuga de Pollo a la plancha',               'almuerzo', 'Proteínas y Legumbres',           'proteina',     '1 filete mediano',                   120, FALSE, 'assets/foods/almuerzo/pechuga-pollo.webp',       5),
  ('carne-res',            'Carne de Res molida o en bistec',             'almuerzo', 'Proteínas y Legumbres',           'proteina',     '1 porción estándar',                 120, FALSE, 'assets/foods/almuerzo/carne-res.webp',           6),
  ('pescado',              'Filete de Pescado',                           'almuerzo', 'Proteínas y Legumbres',           'proteina',     '1 unidad regular',                   110, FALSE, 'assets/foods/almuerzo/pescado.webp',             7),
  ('granos-legumbres',     'Granos / Legumbres (Frijoles, Lentejas o Garbanzos)', 'almuerzo', 'Proteínas y Legumbres',   'proteina',     '1 cucharada de servicio',            50,  FALSE, 'assets/foods/almuerzo/granos-legumbres.webp',    8),
  ('ensalada-fresca',      'Ensalada Fresca (Lechuga, Tomate, Pepino)',   'almuerzo', 'Vegetales y Ensaladas',           'vegetal',      '1 porción abundante',                60,  FALSE, 'assets/foods/almuerzo/ensalada-fresca.webp',     9),
  ('vegetales-vapor',      'Vegetales al Vapor (Zanahoria, Brócoli, Calabacín)', 'almuerzo', 'Vegetales y Ensaladas',    'vegetal',      '1 porción',                          80,  FALSE, 'assets/foods/almuerzo/vegetales-vapor.webp',     10),
  ('agua-mineral',         'Vaso de Agua Mineral',                        'almuerzo', 'Bebidas',                         'bebida',       '1 vaso',                             250, TRUE,  'assets/foods/almuerzo/agua-mineral.webp',        11),
  ('te-jugo-natural',      'Vaso de Té Frío o Jugo Natural',              'almuerzo', 'Bebidas',                         'bebida',       '1 vaso',                             250, TRUE,  'assets/foods/almuerzo/te-jugo-natural.webp',     12),

  -- MATRIZ C — CENA (11)
  ('pan-integral',         'Pan Integral o Árabe',                        'cena',     'Carbohidratos Ligeros / Acompañamientos', 'carbohidrato', '1 rebanada / 1 unidad',      30,  FALSE, 'assets/foods/cena/pan-integral.webp',            1),
  ('arepa-pequena',        'Arepa Pequeña / Tortilla de Trigo',           'cena',     'Carbohidratos Ligeros / Acompañamientos', 'carbohidrato', '1 unidad',                   40,  FALSE, 'assets/foods/cena/arepa-pequena.webp',           2),
  ('galletas-maiz-arroz',  'Galletas Horneadas de Maíz / Arroz',          'cena',     'Carbohidratos Ligeros / Acompañamientos', 'carbohidrato', '2 unidades',                 20,  FALSE, 'assets/foods/cena/galletas-maiz-arroz.webp',     3),
  ('pollo-desmechado',     'Pechuga de Pollo desmechada',                 'cena',     'Proteínas Ligeras',               'proteina',     '1 porción pequeña',                  60,  FALSE, 'assets/foods/cena/pollo-desmechado.webp',        4),
  ('atun',                 'Atún en agua',                                'cena',     'Proteínas Ligeras',               'proteina',     '1 porción (media lata)',             60,  FALSE, 'assets/foods/cena/atun.webp',                    5),
  ('huevo-cocido',         'Huevo Cocido / Pochado',                      'cena',     'Proteínas Ligeras',               'proteina',     '1 unidad',                           50,  FALSE, 'assets/foods/cena/huevo-cocido.webp',            6),
  ('ricotta-cuajada',      'Queso Ricotta / Cuajada ligera',              'cena',     'Proteínas Ligeras',               'lacteo',       '1 porción',                          30,  FALSE, 'assets/foods/cena/ricotta-cuajada.webp',         7),
  ('sopa-verduras',        'Sopa / Crema de Verduras',                    'cena',     'Vegetales y Frutas',              'vegetal',      '1 tazón mediano',                    200, FALSE, 'assets/foods/cena/sopa-verduras.webp',           8),
  ('tomate-aguacate',      'Rodajas de Tomate y Aguacate',                'cena',     'Vegetales y Frutas',              'vegetal',      '1 porción mixta',                    50,  FALSE, 'assets/foods/cena/tomate-aguacate.webp',         9),
  ('infusion-te',          'Taza de Infusión / Té Caliente (Aromática)',  'cena',     'Bebidas',                         'bebida',       '1 taza',                             200, TRUE,  'assets/foods/cena/infusion-te.webp',             10),
  ('leche-descremada',     'Vaso de Leche descremada',                    'cena',     'Bebidas',                         'bebida',       '1 vaso',                             200, TRUE,  'assets/foods/cena/leche-descremada.webp',        11)
ON CONFLICT (slug, momento_dia) DO UPDATE SET
  nombre         = EXCLUDED.nombre,
  grupo          = EXCLUDED.grupo,
  tipo           = EXCLUDED.tipo,
  unidad_display = EXCLUDED.unidad_display,
  peso_gramos    = EXCLUDED.peso_gramos,
  es_bebida      = EXCLUDED.es_bebida,
  imagen         = EXCLUDED.imagen,
  orden          = EXCLUDED.orden;

-- Verificación contra los totales de control del Anexo B. Las sumas son la red que
-- caza un dígito de más: cambiar un solo peso las descuadra y aborta la carga.
DO $$
DECLARE
  esperado CONSTANT JSONB := '[
    {"momento": "desayuno", "filas": 11, "gramos": 859},
    {"momento": "almuerzo", "filas": 12, "gramos": 1290},
    {"momento": "cena",     "filas": 11, "gramos": 940}
  ]';
  fila     JSONB;
  n_filas  INTEGER;
  n_gramos INTEGER;
BEGIN
  FOR fila IN SELECT * FROM jsonb_array_elements(esperado) LOOP
    SELECT COUNT(*), COALESCE(SUM(peso_gramos), 0)
      INTO n_filas, n_gramos
      FROM catalogo_alimentos
     WHERE momento_dia = fila ->> 'momento';

    IF n_filas <> (fila ->> 'filas')::INTEGER THEN
      RAISE EXCEPTION 'Catálogo de % : % filas, se esperaban %',
        fila ->> 'momento', n_filas, fila ->> 'filas';
    END IF;

    IF n_gramos <> (fila ->> 'gramos')::INTEGER THEN
      RAISE EXCEPTION 'Catálogo de % : los pesos suman % g, el Anexo B da % g. Revisa fila por fila.',
        fila ->> 'momento', n_gramos, fila ->> 'gramos';
    END IF;
  END LOOP;

  RAISE NOTICE 'Catálogo verificado: 34 alimentos, 3089 g en total.';
END
$$;
