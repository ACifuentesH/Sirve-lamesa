-- Migración 016: cerrar las tablas del flujo antiguo, fijar el punto único de la
-- lista blanca de investigadores y dejar el modelo de acceso verificable (issue #7).
--
-- @manual  <- init-database.js se salta las migraciones con esta marca.
--
-- ⚠️ APLICAR JUNTO CON LA 012, NUNCA ANTES. Orden exacto:
--       012 → 013 → 014 → 016
--    La 012 es la que le quita a anon el acceso directo a las tablas de datos; esta
--    cierra lo que aquella dejó fuera. Aplicar la 016 sola deja el agujero principal
--    abierto y además hace fallar su propio bloque de verificación (sección 3), que
--    es exactamente lo que debe pasar.
--
-- Idempotente. Todo lo que menciona a los roles anon/authenticated se salta solo en
-- una instalación local de Postgres, donde esos roles no existen.
--
--
-- POR QUÉ HACE FALTA
--
-- Auditoría de los cuatro criterios del issue #7 contra lo que ya había en el
-- repositorio (migraciones 009, 012, 013, 014 + guard e InvestigadorService):
--
--   Criterio 2 (la RPC sigue funcionando para anon) ......... ya cumplido (008 y 012)
--   Criterio 3 (el panel redirige a login sin sesión) ....... ya cumplido (guard + rutas)
--   Criterio 4 (policies en migración versionada) .......... ya cumplido (009/012/013/014)
--   Criterio 1 (anon no lee nada) .......................... INCOMPLETO  ← esto
--
-- El hueco del criterio 1: `database/supabase_rls_anon.sql` — que estuvo aplicado en
-- el proyecto real — creó políticas `FOR SELECT TO anon USING (true)` sobre siete
-- tablas del esquema antiguo:
--
--     componentes, menu, plato, bebida, porcion, menu_plato, menu_bebida
--
-- Ninguna de las migraciones 009 a 014 las nombra. Se limitan a participantes,
-- sesiones_juego, decisiones_porcionamiento, personajes y catalogo_alimentos. Así que
-- incluso después de aplicar la 012, esas siete siguen legibles con la clave anon, y
-- además sin RLS activo: los GRANT por defecto de Supabase sobre el esquema public
-- dejan a anon con INSERT/UPDATE/DELETE sobre ellas.
--
-- Son las tablas del flujo `/juego` antiguo. El flujo vigente (registro → onboarding
-- → simulador → salida) lee solo `personajes` y `catalogo_alimentos`
-- (catalogo.service.ts) y escribe solo por la RPC (envio.service.ts). El panel de
-- análisis lee solo la vista `respuestas_experimento` (api.service.ts
-- fetchVistaRespuestas). Por eso cerrarlas no rompe nada de lo que está en uso.
--
--
-- LO QUE ANON CONSERVA, Y POR QUÉ
--
-- Al terminar esta migración, con la clave anon sola se puede:
--
--   * SELECT sobre `personajes` y `catalogo_alimentos`
--   * EXECUTE de registrar_respuesta_experimento(JSONB)
--
-- y nada más. Los dos SELECT son deliberados: son los datos de estímulo que la
-- pantalla de servicio necesita para pintar el retrato y el catálogo, y el
-- participante nunca inicia sesión. Sin ellos no hay simulación.
--
-- Ninguna de las dos tablas contiene datos de participantes: `personajes` es la
-- matriz de estímulos (tipo, edad_rango, sexo, imagen, nombre del personaje ficticio,
-- imc_representado) y `catalogo_alimentos` es el catálogo de porciones (slug, nombre,
-- momento_dia, grupo, tipo, unidad_display, peso_gramos, imagen). Son definiciones
-- del instrumento, no respuestas.
--
-- Esto desvía de la letra del criterio 1 («no se puede leer ninguna tabla»), que tal
-- como está escrito es incumplible sin romper el simulador. La alternativa —mover la
-- lectura del estímulo detrás de una RPC SECURITY DEFINER— no añade confidencialidad
-- real, porque el catálogo y los retratos son públicos por definición. Queda
-- propuesta la reformulación del criterio en el issue #7.


---------------------------------------------------------------------------
-- 1. Cerrar las siete tablas del esquema antiguo
--
--    RLS activo y sin ninguna política aplicable = ni lectura ni escritura, para
--    cualquier rol de la Data API. Los GRANT son una capa distinta del RLS, así que
--    se revocan aparte: sin eso anon conserva el privilegio aunque no exista política
--    que lo habilite.
--
--    Se revoca también a `authenticated`: el panel de análisis ya no lee estas tablas
--    (solo la vista respuestas_experimento), así que no tiene por qué alcanzarlas.
---------------------------------------------------------------------------
DO $do$
DECLARE
  t          TEXT;
  pol        TEXT;
  hay_anon   BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon');
  hay_auth   BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated');
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'componentes', 'menu', 'plato', 'bebida', 'porcion', 'menu_plato', 'menu_bebida'
  ]
  LOOP
    -- Una instalación que nunca tuvo el esquema antiguo no las tiene: no es un error.
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'tabla % inexistente: se omite', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- Se borran TODAS las políticas, no solo las de nombre conocido. La 014 existe
    -- justamente porque un DROP por nombre no acertó con el que había en el proyecto.
    -- Estas tablas no deben tener ninguna: las permisivas se combinan con OR, así que
    -- basta que sobreviva una con USING (true) para que el REVOKE no sirva de nada.
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, t);
    END LOOP;

    IF hay_anon THEN
      EXECUTE format('REVOKE ALL ON %I FROM anon', t);
    END IF;

    IF hay_auth THEN
      EXECUTE format('REVOKE ALL ON %I FROM authenticated', t);
    END IF;
  END LOOP;

  -- Las secuencias de estas tablas tampoco le hacen falta ya a nadie sin sesión.
  IF hay_anon THEN
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
  END IF;
END
$do$;


---------------------------------------------------------------------------
-- 2. Lista blanca de investigadores — ÚNICO punto donde se declaran los correos
--
-- ⚠️ PENDIENTE: los correos reales no están decididos (issue #7, etiqueta
--    `needs-info`). No se inventan aquí. Mientras este bloque siga comentado, la
--    tabla `investigadores` está vacía y NADIE puede leer el estudio: una cuenta de
--    Supabase Auth que no esté en la lista inicia sesión pero es_investigador()
--    devuelve FALSE y el RLS no le entrega ni una fila.
--
-- Para dar de alta a los 2–3 investigadores del estudio:
--
--   1. Sustituir los marcadores PLACEHOLDER por los correos reales y descomentar el
--      INSERT de abajo. Este archivo es el único sitio donde deben vivir: no
--      hardcodear correos en el frontend ni en el panel de Supabase a mano.
--   2. Ejecutar esta migración.
--   3. Crear en Supabase → Authentication → Users una cuenta por persona, con
--      EXACTAMENTE el mismo correo y una contraseña distinta para cada una.
--
-- El orden importa poco (la comparación es por correo, no por user_id), pero los dos
-- pasos son obligatorios: fila en `investigadores` Y cuenta en Auth. Con solo una de
-- las dos no se entra.
--
-- Baja de un investigador:
--   UPDATE investigadores SET activo = FALSE WHERE email = 'quien@ejemplo.cl';
--
-- La comparación de es_investigador() es case-insensitive (lower() en ambos lados),
-- así que no importa cómo se escriba aquí.
---------------------------------------------------------------------------

-- INSERT INTO investigadores (email, nombre) VALUES
--   ('PLACEHOLDER-investigador-1@ejemplo.cl', 'PLACEHOLDER Nombre Apellido'),
--   ('PLACEHOLDER-investigador-2@ejemplo.cl', 'PLACEHOLDER Nombre Apellido'),
--   ('PLACEHOLDER-investigador-3@ejemplo.cl', 'PLACEHOLDER Nombre Apellido')
-- ON CONFLICT (email) DO UPDATE
--   SET nombre = EXCLUDED.nombre,
--       activo = TRUE;


---------------------------------------------------------------------------
-- 3. Verificación del modelo de acceso
--
-- Comprueba el estado real de los privilegios y aborta la migración si no cuadra.
-- Esto es lo que convierte el criterio 1 en algo comprobable y no en una afirmación:
-- si alguien reabre una tabla por el panel de Supabase, volver a correr esta
-- migración lo detecta.
--
-- Se mira la capa de GRANT (has_table_privilege), no el RLS, porque es la que decide
-- si la Data API llega siquiera a evaluar políticas. Las dos capas tienen que estar
-- bien, y las secciones anteriores más la 012 se ocupan de ambas.
---------------------------------------------------------------------------
DO $do$
DECLARE
  rel        TEXT;
  priv       TEXT;
  problemas  TEXT[] := ARRAY[]::TEXT[];

  -- Relaciones que anon no puede tocar de ninguna manera.
  cerradas   TEXT[] := ARRAY[
    'participantes', 'sesiones_juego', 'decisiones_porcionamiento',
    'investigadores', 'respuestas_experimento',
    'componentes', 'menu', 'plato', 'bebida', 'porcion', 'menu_plato', 'menu_bebida'
  ];

  -- Estímulo: anon lee y nada más.
  estimulo   TEXT[] := ARRAY['personajes', 'catalogo_alimentos'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'rol anon inexistente (Postgres local): no hay nada que verificar';
    RETURN;
  END IF;

  ---- 3.1 Nada de nada sobre las relaciones cerradas -----------------------
  FOREACH rel IN ARRAY cerradas LOOP
    CONTINUE WHEN to_regclass('public.' || rel) IS NULL;

    FOREACH priv IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
      IF has_table_privilege('anon', 'public.' || rel, priv) THEN
        problemas := problemas || format('anon conserva %s sobre %s', priv, rel);
      END IF;
    END LOOP;
  END LOOP;

  ---- 3.2 El estímulo: SELECT sí, escritura no ----------------------------
  FOREACH rel IN ARRAY estimulo LOOP
    CONTINUE WHEN to_regclass('public.' || rel) IS NULL;

    IF NOT has_table_privilege('anon', 'public.' || rel, 'SELECT') THEN
      problemas := problemas || format(
        'anon NO puede leer %s: el simulador no puede pintar el estímulo', rel);
    END IF;

    FOREACH priv IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE'] LOOP
      IF has_table_privilege('anon', 'public.' || rel, priv) THEN
        problemas := problemas || format('anon puede %s sobre %s', priv, rel);
      END IF;
    END LOOP;
  END LOOP;

  ---- 3.3 La RPC de envío sigue siendo ejecutable -------------------------
  IF to_regprocedure('public.registrar_respuesta_experimento(JSONB)') IS NULL THEN
    problemas := problemas || 'la RPC registrar_respuesta_experimento(JSONB) no existe';
  ELSIF NOT has_function_privilege(
          'anon', 'public.registrar_respuesta_experimento(JSONB)', 'EXECUTE') THEN
    problemas := problemas || 'anon NO puede ejecutar la RPC de envío: no se puede enviar nada';
  END IF;

  ---- 3.4 RLS activo en las tablas base ------------------------------------
  FOREACH rel IN ARRAY (cerradas || estimulo) LOOP
    CONTINUE WHEN to_regclass('public.' || rel) IS NULL;

    IF EXISTS (
      SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = rel
         AND c.relkind = 'r'
         AND NOT c.relrowsecurity
    ) THEN
      problemas := problemas || format('RLS desactivado en %s', rel);
    END IF;
  END LOOP;

  ---- Veredicto -----------------------------------------------------------
  IF array_length(problemas, 1) > 0 THEN
    RAISE EXCEPTION E'El modelo de acceso del issue #7 no se cumple:\n  - %',
      array_to_string(problemas, E'\n  - ')
      USING HINT = 'Lo más probable es que falte aplicar la migración 012. Orden: 012, 013, 014, 016.';
  END IF;

  RAISE NOTICE 'Verificación OK: anon solo lee personajes y catalogo_alimentos, y solo ejecuta la RPC de envío.';
END
$do$;


---------------------------------------------------------------------------
-- 4. Aviso: lista blanca vacía
--
-- No es un error —el modelo de acceso es correcto y además es el estado seguro—,
-- pero sí significa que el panel de análisis no lo puede usar nadie todavía.
---------------------------------------------------------------------------
DO $do$
DECLARE
  n INTEGER;
BEGIN
  IF to_regclass('public.investigadores') IS NULL THEN
    RAISE NOTICE 'tabla investigadores inexistente: aplica antes la migración 013';
    RETURN;
  END IF;

  SELECT count(*) INTO n FROM investigadores WHERE activo;

  IF n = 0 THEN
    RAISE NOTICE
      'Lista blanca vacía: ninguna cuenta puede leer el estudio. Ver la sección 2 de esta migración.';
  ELSE
    RAISE NOTICE 'Lista blanca: % investigador(es) activo(s).', n;
  END IF;
END
$do$;


---------------------------------------------------------------------------
-- 5. Comprobación desde fuera, con la clave anon
--
-- La sección 3 mira los privilegios desde dentro de la base de datos. Esto comprueba
-- lo que de verdad pide el criterio 1: qué contesta la Data API a alguien que solo
-- tiene la clave anon. Ejecutar en una terminal, sustituyendo las dos variables por
-- los valores del proyecto (Settings → API). No hace falta sesión ninguna.
--
--   URL="https://<ref>.supabase.co"
--   KEY="<clave publicable / anon>"
--
--   for t in participantes sesiones_juego decisiones_porcionamiento \
--            respuestas_experimento investigadores \
--            componentes menu plato bebida porcion menu_plato menu_bebida; do
--     printf '%-28s ' "$t"
--     curl -s -o /dev/null -w '%{http_code}\n' \
--       "$URL/rest/v1/$t?select=*&limit=1" \
--       -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
--   done
--
-- Esperado: 401 o 404 en las doce. Un 200 con `[]` NO vale — significa que la tabla
-- sigue siendo legible y que lo único que la tapa es que esté vacía.
--
-- Y las dos que sí deben responder 200 con filas:
--
--   curl -s "$URL/rest/v1/personajes?select=slug&limit=3" \
--     -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
--   curl -s "$URL/rest/v1/catalogo_alimentos?select=slug&limit=3" \
--     -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
---------------------------------------------------------------------------
