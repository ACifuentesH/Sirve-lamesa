-- Migración 012: cerrar el acceso directo de anon y dejar la RPC como única
-- puerta de escritura (issue #7, paso 2 de 2; ADR-0001).
--
-- @manual  <- init-database.js se salta las migraciones con esta marca.
--
-- ⚠️ NO APLICAR ANTES DEL CAMBIO DE FLUJO. Esta migración le quita a anon todo
-- acceso directo a las tablas de datos, así que rompe el simulador desplegado
-- mientras siga escribiendo con `.insert()` desde el navegador. Aplicar solo
-- cuando la pantalla de servicio de la Vía B y el EnvioService (issue #12) ya
-- envíen por registrar_respuesta_experimento.
--
-- Hasta entonces rige la migración 009, que ya cortó DELETE y casi todo UPDATE
-- sin romper nada.
--
-- Modelo de acceso que queda:
--   * anon (participante): SELECT sobre el estímulo (personajes, catálogo) y EXECUTE
--     de registrar_respuesta_experimento. Cero acceso directo a las tablas de datos.
--   * authenticated (investigador): SELECT sobre datos y sobre la vista.
--   * La escritura pasa siempre por la RPC, que es SECURITY DEFINER y por eso puede
--     insertar aunque el rol que la llama no tenga permiso sobre las tablas.
--
-- Idempotente. Los roles anon/authenticated solo existen en Supabase, así que todo
-- lo que los menciona se salta en una instalación local de Postgres.

---------------------------------------------------------------------------
-- 1. Retirar las políticas permisivas originales y las interinas de la 009.
--    A partir de aquí anon no tiene ninguna política sobre las tablas de datos,
--    y con RLS activo eso significa cero lectura y cero escritura directa.
---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sirve_anon_all_participantes" ON participantes;
DROP POLICY IF EXISTS "sirve_anon_all_sesiones"      ON sesiones_juego;
DROP POLICY IF EXISTS "sirve_anon_all_decisiones"    ON decisiones_porcionamiento;

DROP POLICY IF EXISTS "sirve_anon_insert_participantes" ON participantes;
DROP POLICY IF EXISTS "sirve_anon_select_participantes" ON participantes;
DROP POLICY IF EXISTS "sirve_anon_insert_sesiones"      ON sesiones_juego;
DROP POLICY IF EXISTS "sirve_anon_select_sesiones"      ON sesiones_juego;
DROP POLICY IF EXISTS "sirve_anon_update_sesiones"      ON sesiones_juego;
DROP POLICY IF EXISTS "sirve_anon_insert_decisiones"    ON decisiones_porcionamiento;
DROP POLICY IF EXISTS "sirve_anon_select_decisiones"    ON decisiones_porcionamiento;

---------------------------------------------------------------------------
-- 2. RLS activo en todo lo alcanzable por la Data API.
--    Con RLS activo y sin política aplicable, el rol no ve ni escribe nada:
--    ese es el default seguro que queremos para las tablas de datos.
---------------------------------------------------------------------------
ALTER TABLE participantes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_juego              ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisiones_porcionamiento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE personajes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_alimentos          ENABLE ROW LEVEL SECURITY;

---------------------------------------------------------------------------
-- 3. Rol anon: solo el estímulo, solo lectura
---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'rol anon inexistente (Postgres local): se omite la parte de Supabase';
    RETURN;
  END IF;

  -- El participante necesita ver los personajes y el catálogo para jugar.
  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_select_personajes" ON personajes';
  EXECUTE 'CREATE POLICY "sirve_anon_select_personajes" ON personajes
             FOR SELECT TO anon USING (true)';
  EXECUTE 'GRANT SELECT ON personajes TO anon';

  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_select_catalogo" ON catalogo_alimentos';
  EXECUTE 'CREATE POLICY "sirve_anon_select_catalogo" ON catalogo_alimentos
             FOR SELECT TO anon USING (true)';
  EXECUTE 'GRANT SELECT ON catalogo_alimentos TO anon';

  -- Los GRANT de tabla son una capa distinta de RLS: hay que revocarlos también,
  -- o anon conserva el privilegio aunque no exista política que lo habilite.
  EXECUTE 'REVOKE ALL ON participantes             FROM anon';
  EXECUTE 'REVOKE ALL ON sesiones_juego            FROM anon';
  EXECUTE 'REVOKE ALL ON decisiones_porcionamiento FROM anon';

  -- Los permisos por columna viven en un ACL aparte del de la tabla: el REVOKE ALL
  -- de arriba no basta para retirar el GRANT acotado que dejó la 009.
  EXECUTE 'REVOKE UPDATE (fecha_fin, estado, notas) ON sesiones_juego FROM anon';

  -- Las secuencias dejan de ser necesarias: ya no inserta anon directamente.
  -- Se revocan en bloque para no depender de los nombres autogenerados por SERIAL.
  EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';

  -- La única puerta de escritura.
  EXECUTE 'GRANT EXECUTE ON FUNCTION registrar_respuesta_experimento(JSONB) TO anon';
END
$do$;

---------------------------------------------------------------------------
-- 4. Rol authenticated: el investigador lee los datos del estudio
--
-- Las políticas las define la 013 contra la lista blanca (es_investigador()); aquí
-- solo se aseguran los GRANT. No se recrean: hacerlo con USING (true), como estaba
-- escrito antes de la 013, habría reabierto la lectura a cualquier cuenta registrada.
---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE NOTICE 'rol authenticated inexistente (Postgres local): se omite';
    RETURN;
  END IF;

  EXECUTE 'GRANT SELECT ON participantes             TO authenticated';
  EXECUTE 'GRANT SELECT ON sesiones_juego            TO authenticated';
  EXECUTE 'GRANT SELECT ON decisiones_porcionamiento TO authenticated';
END
$do$;

---------------------------------------------------------------------------
-- 5. La vista respuestas_experimento
--
-- El blindaje (security_invoker + REVOKE a anon) ya lo hace la 007, donde se crea
-- la vista. Se repite aquí el GRANT a authenticated por si la vista se recreó por
-- fuera de la migración: un CREATE OR REPLACE VIEW conserva los privilegios, pero
-- un DROP + CREATE los pierde sin avisar.
---------------------------------------------------------------------------
DO $do$
BEGIN
  IF current_setting('server_version_num')::INTEGER >= 150000 THEN
    EXECUTE 'ALTER VIEW respuestas_experimento SET (security_invoker = true)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON respuestas_experimento FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT SELECT ON respuestas_experimento TO authenticated';
  END IF;
END
$do$;

---------------------------------------------------------------------------
-- 6. Nota sobre la RPC en el esquema public
--
-- El linter de Supabase marca esta función con dos avisos
-- (0028/0029_*_security_definer_function_executable) porque anon y authenticated
-- pueden ejecutar una función SECURITY DEFINER. Aquí es deliberado: la función ES
-- el punto de entrada de la Data API y tiene que ser invocable por RPC. El riesgo
-- se acota con REVOKE ALL FROM PUBLIC (migración 008), un GRANT explícito solo a
-- anon y authenticated, search_path fijo, y validación de todo el payload dentro
-- de la función.
---------------------------------------------------------------------------
