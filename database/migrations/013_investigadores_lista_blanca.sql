-- Migración 013: el acceso del investigador se restringe a una lista blanca.
--
-- La 009 le dio SELECT al rol `authenticated` pensando en el panel de análisis,
-- pero Supabase permite el registro público por defecto: cualquiera podía crearse
-- una cuenta y quedar habilitado para leer el estudio completo. Con esto, tener
-- sesión ya no basta; hay que estar en la lista.
--
-- Se identifica por correo y no por user_id para que dar de alta a alguien sea una
-- sola acción (crear la cuenta en el panel de Supabase con un correo ya listado) en
-- vez de dos. Cambiar de correo en Supabase exige confirmar la nueva dirección, así
-- que nadie se cuela moviéndose a un correo de la lista sin acceso a ese buzón.
--
-- Alta de un investigador:
--   1. INSERT INTO investigadores (email, nombre) VALUES ('quien@ejemplo.edu', 'Nombre');
--   2. Crear la cuenta con ese mismo correo en Authentication → Users.
-- Baja: UPDATE investigadores SET activo = FALSE WHERE email = '...';
--
-- Idempotente.

CREATE TABLE IF NOT EXISTS investigadores (
  email     TEXT PRIMARY KEY,
  nombre    TEXT,
  activo    BOOLEAN     NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sin políticas: la tabla no se alcanza por la Data API. Solo la lee la función de
-- abajo, que es SECURITY DEFINER y por eso pasa por encima del RLS.
ALTER TABLE investigadores ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON investigadores FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON investigadores FROM authenticated';
  END IF;
END
$do$;

CREATE OR REPLACE FUNCTION public.es_investigador()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
  SELECT EXISTS (
    SELECT 1
      FROM investigadores
     WHERE activo
       AND lower(email) = lower(auth.jwt() ->> 'email')
  );
$fn$;

COMMENT ON FUNCTION public.es_investigador() IS
  'TRUE si el correo del JWT esta en la lista blanca de investigadores. Sin JWT devuelve FALSE.';

REVOKE ALL ON FUNCTION public.es_investigador() FROM PUBLIC;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.es_investigador() TO authenticated';
  END IF;
END
$do$;

---------------------------------------------------------------------------
-- Políticas de lectura: sesión iniciada Y en la lista.
--
-- La llamada va envuelta en un SELECT para que Postgres la evalúe una vez por
-- consulta (initplan) y no una vez por fila.
--
-- Se eliminan los dos juegos de nombres: los cortos que usó la 009
-- (sirve_auth_select_sesiones) y los canónicos derivados de la tabla. Las políticas
-- permisivas se combinan con OR, así que dejar una vieja con USING (true) viva
-- anularía por completo la lista blanca.
---------------------------------------------------------------------------
DO $do$
DECLARE
  t TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE NOTICE 'rol authenticated inexistente (Postgres local): se omite';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "sirve_auth_select_sesiones"   ON sesiones_juego';
  EXECUTE 'DROP POLICY IF EXISTS "sirve_auth_select_decisiones" ON decisiones_porcionamiento';
  EXECUTE 'DROP POLICY IF EXISTS "sirve_auth_select_catalogo"   ON catalogo_alimentos';

  FOREACH t IN ARRAY ARRAY['participantes','sesiones_juego','decisiones_porcionamiento','catalogo_alimentos']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'sirve_auth_select_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING ((SELECT public.es_investigador()))',
      'sirve_auth_select_' || t, t
    );
  END LOOP;
END
$do$;
