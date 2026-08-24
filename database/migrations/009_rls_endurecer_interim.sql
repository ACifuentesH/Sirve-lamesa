-- Migración 009: endurecimiento INTERINO del RLS, sin romper el flujo desplegado
-- (issue #7, paso 1 de 2; el cierre definitivo es la migración 012).
--
-- Contexto. database/supabase_rls_anon.sql dejó políticas `FOR ALL TO anon` sobre
-- participantes, sesiones_juego y decisiones_porcionamiento, y los GRANT de
-- Supabase le daban además SELECT/INSERT/UPDATE/DELETE sobre las once tablas del
-- esquema. Con el repositorio público y la clave anon versionada, cualquiera podía
-- vaciar el estudio con una sola petición.
--
-- Por qué no se cierra todo de una vez. La app desplegada escribe directo a las
-- tablas y encadena `.insert(...).select()` para recuperar el id generado
-- (api.service.ts líneas 81, 173, 443 y 476). Quitarle SELECT a anon rompería el
-- registro del participante, no solo el panel de análisis. Así que aquí se corta
-- todo lo que se puede cortar sin romper nada:
--
--   * Desaparece DELETE en todas las tablas.
--   * Desaparece UPDATE, salvo las tres columnas que necesita finalizarSesion()
--     para marcar la sesión como completada (api.service.ts:184).
--   * El estímulo (personajes, menú, catálogo…) pasa a ser de solo lectura.
--
-- Lo que esta migración NO resuelve: anon todavía puede LEER los datos. Eso se
-- neutraliza rotando la clave anon (que invalida la publicada en el repo) y se
-- cierra del todo en la 012, cuando el envío pase por la RPC.
--
-- Idempotente. Los roles de Supabase se omiten en Postgres local.

---------------------------------------------------------------------------
-- 1. Fuera las políticas permisivas FOR ALL
---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sirve_anon_all_participantes" ON participantes;
DROP POLICY IF EXISTS "sirve_anon_all_sesiones"      ON sesiones_juego;
DROP POLICY IF EXISTS "sirve_anon_all_decisiones"    ON decisiones_porcionamiento;

---------------------------------------------------------------------------
-- 2. RLS activo en todo lo alcanzable por la Data API.
--
-- catalogo_alimentos nace en la 006 sin RLS: una tabla nueva en el esquema public
-- hereda los privilegios por defecto de Supabase, así que sin esto queda abierta.
---------------------------------------------------------------------------
ALTER TABLE participantes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_juego            ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisiones_porcionamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE personajes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_alimentos        ENABLE ROW LEVEL SECURITY;

---------------------------------------------------------------------------
-- 3. anon sobre los datos del estudio
--
-- Políticas por comando (y no FOR ALL) para que quede explícito lo que falta: no
-- hay DELETE en ninguna de las tres tablas, y solo hay UPDATE en sesiones_juego.
-- Un participante malicioso puede, en el peor caso, insertar basura; no puede
-- destruir lo ya recogido.
---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'rol anon inexistente (Postgres local): se omite la parte de Supabase';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_insert_participantes" ON participantes';
  EXECUTE 'CREATE POLICY "sirve_anon_insert_participantes" ON participantes
             FOR INSERT TO anon WITH CHECK (true)';
  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_select_participantes" ON participantes';
  EXECUTE 'CREATE POLICY "sirve_anon_select_participantes" ON participantes
             FOR SELECT TO anon USING (true)';

  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_insert_sesiones" ON sesiones_juego';
  EXECUTE 'CREATE POLICY "sirve_anon_insert_sesiones" ON sesiones_juego
             FOR INSERT TO anon WITH CHECK (true)';
  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_select_sesiones" ON sesiones_juego';
  EXECUTE 'CREATE POLICY "sirve_anon_select_sesiones" ON sesiones_juego
             FOR SELECT TO anon USING (true)';

  -- finalizarSesion() marca la sesión como completada. Se conserva el UPDATE, pero
  -- acotado por GRANT a nivel de columna más abajo: el RLS filtra filas, no columnas.
  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_update_sesiones" ON sesiones_juego';
  EXECUTE 'CREATE POLICY "sirve_anon_update_sesiones" ON sesiones_juego
             FOR UPDATE TO anon USING (true) WITH CHECK (true)';

  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_insert_decisiones" ON decisiones_porcionamiento';
  EXECUTE 'CREATE POLICY "sirve_anon_insert_decisiones" ON decisiones_porcionamiento
             FOR INSERT TO anon WITH CHECK (true)';
  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_select_decisiones" ON decisiones_porcionamiento';
  EXECUTE 'CREATE POLICY "sirve_anon_select_decisiones" ON decisiones_porcionamiento
             FOR SELECT TO anon USING (true)';

  -- Los GRANT son una capa distinta del RLS: hay que revocarlos igual, o anon
  -- conserva el privilegio en cuanto alguien desactive una política.
  EXECUTE 'REVOKE ALL ON participantes             FROM anon';
  EXECUTE 'REVOKE ALL ON sesiones_juego            FROM anon';
  EXECUTE 'REVOKE ALL ON decisiones_porcionamiento FROM anon';

  EXECUTE 'GRANT INSERT, SELECT ON participantes             TO anon';
  EXECUTE 'GRANT INSERT, SELECT ON decisiones_porcionamiento TO anon';
  EXECUTE 'GRANT INSERT, SELECT ON sesiones_juego            TO anon';

  -- Único UPDATE que sobrevive, y solo sobre estas tres columnas: son exactamente
  -- las que envía finalizarSesion(). duracion_total_segundos la calcula el trigger,
  -- que corre con los permisos de la tabla y no necesita GRANT para anon.
  EXECUTE 'GRANT UPDATE (fecha_fin, estado, notas) ON sesiones_juego TO anon';

  -- Insertar en columnas SERIAL exige USAGE sobre la secuencia. Se resuelven por
  -- nombre real para no depender de la convención de nombres de SERIAL.
  EXECUTE format('GRANT USAGE ON SEQUENCE %s TO anon', pg_get_serial_sequence('participantes', 'pk_participante'));
  EXECUTE format('GRANT USAGE ON SEQUENCE %s TO anon', pg_get_serial_sequence('sesiones_juego', 'pk_sesion'));
  EXECUTE format('GRANT USAGE ON SEQUENCE %s TO anon', pg_get_serial_sequence('decisiones_porcionamiento', 'pk_decision'));
END
$do$;

---------------------------------------------------------------------------
-- 4. anon sobre el estímulo: solo lectura
--
-- El RLS ya lo limitaba a SELECT, pero los GRANT seguían permitiendo escritura si
-- alguna vez se desactivara una política. Se retiran por defensa en capas.
---------------------------------------------------------------------------
DO $do$
DECLARE
  t TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RETURN;
  END IF;

  FOREACH t IN ARRAY ARRAY['personajes','componentes','menu','plato','porcion','bebida','menu_plato','menu_bebida','catalogo_alimentos']
  LOOP
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
    EXECUTE format('GRANT SELECT ON %I TO anon', t);
  END LOOP;

  EXECUTE 'DROP POLICY IF EXISTS "sirve_anon_select_catalogo" ON catalogo_alimentos';
  EXECUTE 'CREATE POLICY "sirve_anon_select_catalogo" ON catalogo_alimentos
             FOR SELECT TO anon USING (true)';
END
$do$;

---------------------------------------------------------------------------
-- 5. authenticated: el investigador lee el estudio
--
-- La vista respuestas_experimento quedó con security_invoker en la 007, así que
-- devuelve filas solo si el rol que consulta tiene política SELECT en las tablas
-- base. Sin esto, el panel de investigadores vería cero filas y ningún error.
---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE NOTICE 'rol authenticated inexistente (Postgres local): se omite';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "sirve_auth_select_participantes" ON participantes';
  EXECUTE 'CREATE POLICY "sirve_auth_select_participantes" ON participantes
             FOR SELECT TO authenticated USING (true)';

  EXECUTE 'DROP POLICY IF EXISTS "sirve_auth_select_sesiones" ON sesiones_juego';
  EXECUTE 'CREATE POLICY "sirve_auth_select_sesiones" ON sesiones_juego
             FOR SELECT TO authenticated USING (true)';

  EXECUTE 'DROP POLICY IF EXISTS "sirve_auth_select_decisiones" ON decisiones_porcionamiento';
  EXECUTE 'CREATE POLICY "sirve_auth_select_decisiones" ON decisiones_porcionamiento
             FOR SELECT TO authenticated USING (true)';

  EXECUTE 'DROP POLICY IF EXISTS "sirve_auth_select_catalogo" ON catalogo_alimentos';
  EXECUTE 'CREATE POLICY "sirve_auth_select_catalogo" ON catalogo_alimentos
             FOR SELECT TO authenticated USING (true)';

  EXECUTE 'REVOKE ALL ON participantes             FROM authenticated';
  EXECUTE 'REVOKE ALL ON sesiones_juego            FROM authenticated';
  EXECUTE 'REVOKE ALL ON decisiones_porcionamiento FROM authenticated';

  EXECUTE 'GRANT SELECT ON participantes             TO authenticated';
  EXECUTE 'GRANT SELECT ON sesiones_juego            TO authenticated';
  EXECUTE 'GRANT SELECT ON decisiones_porcionamiento TO authenticated';
  EXECUTE 'GRANT SELECT ON respuestas_experimento    TO authenticated';
END
$do$;
