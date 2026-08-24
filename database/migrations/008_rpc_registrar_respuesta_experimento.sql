-- Migración 008: RPC del envío consolidado del experimento (ADR-0001, issue #6)
--
-- Implementa `registrar_respuesta_experimento(payload jsonb)`, el único punto de
-- escritura del experimento: recibe el PayloadEnvio de docs/CONTRATO-DATOS.md y
-- escribe Participantes + Sesiones_juego + Decisiones_porcionamiento.
--
-- Por qué una función y no tres inserts desde el cliente:
--   * Transacción real: cualquier RAISE deshace todo, no quedan huérfanos.
--   * El peso en gramos se recalcula aquí desde Catalogo_alimentos; el total que
--     manda el cliente no es de fiar en un instrumento de investigación.
--   * Las validaciones del protocolo (tope de 4 porciones, plato vacío) viven en
--     un solo lugar y no se pueden esquivar manipulando el navegador.
--
-- SECURITY DEFINER + search_path fijo: permite que `anon` ejecute la función sin
-- tener permiso de escritura directa sobre las tablas.
--
-- Idempotente (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION registrar_respuesta_experimento(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- Secciones del payload
  j_participante JSONB;
  j_sesion       JSONB;
  j_contexto     JSONB;
  j_conducta     JSONB;
  j_plato        JSONB;
  j_alimentos    JSONB;
  j_bebida       JSONB;
  j_clics        JSONB;
  j_item         JSONB;

  -- Participante
  v_edad     INTEGER;
  v_peso     NUMERIC;
  v_altura   NUMERIC;
  v_imc      NUMERIC;
  v_genero   TEXT;
  v_nivel    TEXT;
  v_semestre TEXT;
  v_etnia    TEXT;
  v_reg_ori  TEXT;
  v_reg_res  TEXT;
  v_consent  BOOLEAN;

  -- Sesión
  v_fecha_inicio TIMESTAMP;
  v_ahora        TIMESTAMP;
  v_duracion     INTEGER;

  -- Contexto asignado
  v_personaje_id     INTEGER;
  v_personaje_nombre TEXT;
  v_perfil_edad      TEXT;
  v_edad_rango       TEXT;
  v_personaje_genero TEXT;
  v_momento          TEXT;

  -- Conducta
  v_segundos NUMERIC;

  -- Resultado del plato
  v_porciones      INTEGER;
  v_cat_peso       INTEGER;
  v_cat_es_bebida  BOOLEAN;
  v_cat_momento    TEXT;
  v_total_servidor NUMERIC := 0;
  v_total_cliente  NUMERIC;
  v_bebida_ml      INTEGER := 0;
  v_bebida_slug    TEXT    := NULL;
  v_bebida_cliente NUMERIC;
  v_n_alimentos    INTEGER;
  v_n_distintos    INTEGER;
  v_notas          TEXT    := NULL;

  -- Ids resultantes
  v_participante_id INTEGER;
  v_sesion_id       INTEGER;
  v_decision_id     INTEGER;
BEGIN
  ---------------------------------------------------------------------------
  -- 0. Estructura general
  ---------------------------------------------------------------------------
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'payload ausente o no es un objeto JSON';
  END IF;

  j_participante := payload -> 'participante';
  j_sesion       := payload -> 'sesion';
  j_contexto     := payload -> 'contexto_asignado';
  j_conducta     := payload -> 'conducta';
  j_plato        := payload -> 'resultado_plato';

  IF j_participante IS NULL OR jsonb_typeof(j_participante) <> 'object' THEN
    RAISE EXCEPTION 'falta la seccion "participante"';
  END IF;
  IF j_sesion IS NULL OR jsonb_typeof(j_sesion) <> 'object' THEN
    RAISE EXCEPTION 'falta la seccion "sesion"';
  END IF;
  IF j_contexto IS NULL OR jsonb_typeof(j_contexto) <> 'object' THEN
    RAISE EXCEPTION 'falta la seccion "contexto_asignado"';
  END IF;
  IF j_conducta IS NULL OR jsonb_typeof(j_conducta) <> 'object' THEN
    RAISE EXCEPTION 'falta la seccion "conducta"';
  END IF;
  IF j_plato IS NULL OR jsonb_typeof(j_plato) <> 'object' THEN
    RAISE EXCEPTION 'falta la seccion "resultado_plato"';
  END IF;

  ---------------------------------------------------------------------------
  -- 1. Participante (Módulo 2). Las columnas quedaron NULLABLE en la 005
  --    para no romper históricos; la obligatoriedad se exige aquí.
  ---------------------------------------------------------------------------
  IF jsonb_typeof(j_participante -> 'edad') <> 'number' THEN
    RAISE EXCEPTION 'participante.edad es obligatoria y debe ser numerica';
  END IF;
  IF jsonb_typeof(j_participante -> 'peso_kg') <> 'number' THEN
    RAISE EXCEPTION 'participante.peso_kg es obligatorio y debe ser numerico';
  END IF;
  IF jsonb_typeof(j_participante -> 'altura_cm') <> 'number' THEN
    RAISE EXCEPTION 'participante.altura_cm es obligatoria y debe ser numerica';
  END IF;

  v_edad   := (j_participante ->> 'edad')::INTEGER;
  v_peso   := (j_participante ->> 'peso_kg')::NUMERIC;
  v_altura := (j_participante ->> 'altura_cm')::NUMERIC;

  IF v_edad <= 0 OR v_edad >= 150 THEN
    RAISE EXCEPTION 'participante.edad fuera de rango: %', v_edad;
  END IF;
  IF v_peso <= 0 THEN
    RAISE EXCEPTION 'participante.peso_kg debe ser mayor que cero: %', v_peso;
  END IF;
  IF v_altura <= 0 THEN
    RAISE EXCEPTION 'participante.altura_cm debe ser mayor que cero: %', v_altura;
  END IF;

  v_genero  := j_participante ->> 'genero';
  v_nivel   := j_participante ->> 'nivel_estudios';
  v_etnia   := j_participante ->> 'etnia';
  v_reg_ori := j_participante ->> 'region_origen';
  v_reg_res := j_participante ->> 'region_residencia';
  v_semestre := j_participante ->> 'semestre_o_anio';

  IF v_genero IS NULL OR v_genero NOT IN ('masculino','femenino','no_binario','prefiero_no_decir') THEN
    RAISE EXCEPTION 'participante.genero invalido o ausente: %', COALESCE(v_genero, '(null)');
  END IF;
  IF v_nivel IS NULL OR v_nivel NOT IN ('pregrado_curso','pregrado_completo','posgrado','otro') THEN
    RAISE EXCEPTION 'participante.nivel_estudios invalido o ausente: %', COALESCE(v_nivel, '(null)');
  END IF;
  IF v_etnia IS NULL OR v_etnia NOT IN ('latino_hispano','afrodescendiente','indigena','blanco','otro') THEN
    RAISE EXCEPTION 'participante.etnia invalida o ausente: %', COALESCE(v_etnia, '(null)');
  END IF;
  IF v_reg_ori IS NULL OR btrim(v_reg_ori) = '' THEN
    RAISE EXCEPTION 'participante.region_origen es obligatoria';
  END IF;
  IF v_reg_res IS NULL OR btrim(v_reg_res) = '' THEN
    RAISE EXCEPTION 'participante.region_residencia es obligatoria';
  END IF;

  -- El semestre solo es obligatorio para pregrado en curso (validador condicional de A3).
  IF v_nivel = 'pregrado_curso' AND (v_semestre IS NULL OR btrim(v_semestre) = '') THEN
    RAISE EXCEPTION 'participante.semestre_o_anio es obligatorio cuando nivel_estudios = pregrado_curso';
  END IF;

  -- Sin consentimiento no se registra: es un estudio con sujetos humanos.
  v_consent := COALESCE((j_participante ->> 'consentimiento_informado')::BOOLEAN, FALSE);
  IF NOT v_consent THEN
    RAISE EXCEPTION 'no se puede registrar una respuesta sin consentimiento informado';
  END IF;

  -- El cast explícito a numeric evita depender de la resolución de POWER, que
  -- según los tipos de entrada puede devolver double precision (y ROUND(double, int)
  -- no existe en Postgres).
  v_imc := ROUND((v_peso / POWER(v_altura / 100.0, 2))::NUMERIC, 2);

  ---------------------------------------------------------------------------
  -- 2. Contexto asignado (§3, §4)
  ---------------------------------------------------------------------------
  v_momento          := j_contexto ->> 'momento_dia';
  v_personaje_nombre := j_contexto ->> 'personaje_nombre';
  v_perfil_edad      := j_contexto ->> 'personaje_perfil_edad';
  v_edad_rango       := j_contexto ->> 'personaje_edad_rango';
  v_personaje_genero := j_contexto ->> 'personaje_genero';

  IF v_momento IS NULL OR v_momento NOT IN ('desayuno','almuerzo','cena') THEN
    RAISE EXCEPTION 'contexto_asignado.momento_dia invalido: %', COALESCE(v_momento, '(null)');
  END IF;
  IF v_personaje_nombre IS NULL OR btrim(v_personaje_nombre) = '' THEN
    RAISE EXCEPTION 'contexto_asignado.personaje_nombre es obligatorio';
  END IF;
  IF v_personaje_genero IS NULL OR v_personaje_genero NOT IN ('M','F') THEN
    RAISE EXCEPTION 'contexto_asignado.personaje_genero debe ser M o F';
  END IF;

  IF jsonb_typeof(j_contexto -> 'personaje_id') <> 'number' THEN
    RAISE EXCEPTION 'contexto_asignado.personaje_id es obligatorio';
  END IF;
  v_personaje_id := (j_contexto ->> 'personaje_id')::INTEGER;

  IF NOT EXISTS (SELECT 1 FROM personajes WHERE pk_personaje = v_personaje_id) THEN
    RAISE EXCEPTION 'personaje inexistente: personaje_id=%', v_personaje_id;
  END IF;

  ---------------------------------------------------------------------------
  -- 3. Conducta (§7.1)
  ---------------------------------------------------------------------------
  IF jsonb_typeof(j_conducta -> 'tiempo_decision_segundos') <> 'number' THEN
    RAISE EXCEPTION 'conducta.tiempo_decision_segundos es obligatorio y numerico';
  END IF;
  v_segundos := (j_conducta ->> 'tiempo_decision_segundos')::NUMERIC;
  IF v_segundos < 0 THEN
    RAISE EXCEPTION 'conducta.tiempo_decision_segundos no puede ser negativo: %', v_segundos;
  END IF;

  j_clics := j_conducta -> 'secuencia_clics';
  IF j_clics IS NULL OR jsonb_typeof(j_clics) <> 'array' THEN
    RAISE EXCEPTION 'conducta.secuencia_clics debe ser un arreglo';
  END IF;

  ---------------------------------------------------------------------------
  -- 4. Plato: validación y recálculo de gramos (§5.3, §5.4)
  ---------------------------------------------------------------------------
  j_alimentos := j_plato -> 'alimentos';
  IF j_alimentos IS NULL OR jsonb_typeof(j_alimentos) <> 'array' THEN
    RAISE EXCEPTION 'resultado_plato.alimentos debe ser un arreglo';
  END IF;

  v_n_alimentos := jsonb_array_length(j_alimentos);

  -- Un plato con solo bebida cuenta como vacío (regla 5 del contrato).
  IF v_n_alimentos = 0 THEN
    RAISE EXCEPTION 'plato vacio: hay que servir al menos un alimento antes de continuar';
  END IF;

  -- Un mismo alimento no puede venir en dos entradas: las porciones se agregan.
  -- Se cuenta con DISTINCT en subconsulta y no con COUNT(DISTINCT ...) porque el
  -- agregado ignora los NULL, y un alimento_id ausente daría un error engañoso
  -- de "repetidos" en vez del de alimento inexistente que lanza el bucle.
  SELECT COUNT(*)
    INTO v_n_distintos
    FROM (
      SELECT DISTINCT elem ->> 'alimento_id' AS id
        FROM jsonb_array_elements(j_alimentos) AS elem
    ) AS ids;

  IF v_n_distintos <> v_n_alimentos THEN
    RAISE EXCEPTION 'hay alimentos repetidos en el plato: las porciones deben agregarse en una sola entrada';
  END IF;

  FOR j_item IN SELECT elem FROM jsonb_array_elements(j_alimentos) AS elem LOOP
    IF jsonb_typeof(j_item -> 'porciones') <> 'number' THEN
      RAISE EXCEPTION 'porciones ausente o no numerico en alimento %', COALESCE(j_item ->> 'slug', '(sin slug)');
    END IF;

    v_porciones := (j_item ->> 'porciones')::INTEGER;

    -- Tope de 4 porciones por alimento (§5.3).
    IF v_porciones < 1 OR v_porciones > 4 THEN
      RAISE EXCEPTION 'porciones fuera de rango (1..4) en alimento %: %',
        COALESCE(j_item ->> 'slug', '(sin slug)'), v_porciones;
    END IF;

    SELECT peso_gramos, es_bebida, momento_dia
      INTO v_cat_peso, v_cat_es_bebida, v_cat_momento
      FROM catalogo_alimentos
     WHERE pk_alimento = (j_item ->> 'alimento_id')::INTEGER;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'alimento inexistente en el catalogo: alimento_id=%, slug=%',
        COALESCE(j_item ->> 'alimento_id', '(null)'), COALESCE(j_item ->> 'slug', '(null)');
    END IF;

    -- Las bebidas van al contenedor externo, nunca en el plato (§5.2).
    IF v_cat_es_bebida THEN
      RAISE EXCEPTION 'la bebida % no puede formar parte del plato: va en el contenedor externo',
        COALESCE(j_item ->> 'slug', '(null)');
    END IF;

    -- Integridad del estímulo: el alimento tiene que pertenecer al catálogo asignado.
    IF v_cat_momento <> v_momento THEN
      RAISE EXCEPTION 'el alimento % pertenece al catalogo de % y la asignacion es de %',
        COALESCE(j_item ->> 'slug', '(null)'), v_cat_momento, v_momento;
    END IF;

    v_total_servidor := v_total_servidor + (v_porciones * v_cat_peso);
  END LOOP;

  ---------------------------------------------------------------------------
  -- 5. Bebida: opcional, en ml, jamás sumada a los gramos del plato (§5.4)
  ---------------------------------------------------------------------------
  j_bebida := j_plato -> 'bebida';

  IF j_bebida IS NULL OR jsonb_typeof(j_bebida) = 'null' THEN
    v_bebida_ml   := 0;
    v_bebida_slug := NULL;
  ELSIF jsonb_typeof(j_bebida) <> 'object' THEN
    RAISE EXCEPTION 'resultado_plato.bebida debe ser un objeto o null';
  ELSE
    IF jsonb_typeof(j_bebida -> 'porciones') <> 'number' THEN
      RAISE EXCEPTION 'bebida.porciones ausente o no numerico';
    END IF;

    v_porciones := (j_bebida ->> 'porciones')::INTEGER;
    IF v_porciones < 1 OR v_porciones > 4 THEN
      RAISE EXCEPTION 'bebida.porciones fuera de rango (1..4): %', v_porciones;
    END IF;

    SELECT peso_gramos, es_bebida, momento_dia, slug
      INTO v_cat_peso, v_cat_es_bebida, v_cat_momento, v_bebida_slug
      FROM catalogo_alimentos
     WHERE pk_alimento = (j_bebida ->> 'alimento_id')::INTEGER;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'bebida inexistente en el catalogo: alimento_id=%, slug=%',
        COALESCE(j_bebida ->> 'alimento_id', '(null)'), COALESCE(j_bebida ->> 'slug', '(null)');
    END IF;

    IF NOT v_cat_es_bebida THEN
      RAISE EXCEPTION 'el alimento % no es una bebida y no puede ir en el contenedor externo',
        COALESCE(j_bebida ->> 'slug', '(null)');
    END IF;

    IF v_cat_momento <> v_momento THEN
      RAISE EXCEPTION 'la bebida % pertenece al catalogo de % y la asignacion es de %',
        COALESCE(j_bebida ->> 'slug', '(null)'), v_cat_momento, v_momento;
    END IF;

    -- En el catálogo, peso_gramos de una bebida almacena su volumen en ml.
    v_bebida_ml := v_porciones * v_cat_peso;
  END IF;

  ---------------------------------------------------------------------------
  -- 6. El servidor manda sobre los totales (regla 6 del contrato)
  ---------------------------------------------------------------------------
  v_total_cliente  := (j_plato ->> 'total_plato_gramos')::NUMERIC;
  v_bebida_cliente := (j_plato ->> 'total_bebida_ml')::NUMERIC;

  IF v_total_cliente IS DISTINCT FROM v_total_servidor THEN
    v_notas := format(
      'total_plato_gramos del cliente (%s) difiere del recalculado en servidor (%s); prevalece el del servidor.',
      COALESCE(v_total_cliente::TEXT, '(null)'), v_total_servidor::TEXT
    );
  END IF;

  IF v_bebida_cliente IS DISTINCT FROM v_bebida_ml THEN
    v_notas := concat_ws(' ', v_notas, format(
      'total_bebida_ml del cliente (%s) difiere del recalculado en servidor (%s); prevalece el del servidor.',
      COALESCE(v_bebida_cliente::TEXT, '(null)'), v_bebida_ml::TEXT
    ));
  END IF;

  ---------------------------------------------------------------------------
  -- 7. Inserciones. Todo esto es una sola transacción: cualquier RAISE
  --    anterior o posterior deshace el conjunto completo.
  ---------------------------------------------------------------------------
  INSERT INTO participantes (
    edad, peso_kg, altura_cm, imc,
    genero, nivel_estudios, semestre_o_anio, etnia,
    region_origen, region_residencia,
    consentimiento_informado
  ) VALUES (
    v_edad, v_peso, v_altura, v_imc,
    v_genero, v_nivel, NULLIF(btrim(COALESCE(v_semestre, '')), ''), v_etnia,
    v_reg_ori, v_reg_res,
    TRUE
  )
  RETURNING pk_participante INTO v_participante_id;

  -- fecha_inicio llega en ISO 8601 UTC; las columnas son TIMESTAMP sin zona,
  -- así que se normaliza todo a UTC para que las duraciones sean comparables.
  v_ahora := (now() AT TIME ZONE 'UTC');

  BEGIN
    v_fecha_inicio := ((j_sesion ->> 'fecha_inicio')::TIMESTAMPTZ) AT TIME ZONE 'UTC';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'sesion.fecha_inicio no es una fecha ISO 8601 valida: %',
      COALESCE(j_sesion ->> 'fecha_inicio', '(null)');
  END;

  IF v_fecha_inicio IS NULL THEN
    v_fecha_inicio := v_ahora;
  END IF;

  -- Un reloj de cliente adelantado no debe producir duraciones negativas.
  v_duracion := GREATEST(0, EXTRACT(EPOCH FROM (v_ahora - v_fecha_inicio))::INTEGER);

  INSERT INTO sesiones_juego (
    fk_participante, fecha_inicio, fecha_fin, duracion_total_segundos,
    estado, dispositivo, navegador, resolucion_pantalla
  ) VALUES (
    v_participante_id, v_fecha_inicio, v_ahora, v_duracion,
    'completada',
    LEFT(COALESCE(j_sesion ->> 'dispositivo', 'web'), 50),
    j_sesion ->> 'navegador',
    NULLIF(LEFT(COALESCE(j_sesion ->> 'resolucion_pantalla', ''), 20), '')
  )
  RETURNING pk_sesion INTO v_sesion_id;

  INSERT INTO decisiones_porcionamiento (
    fk_sesion, escenario,
    personaje_tipo, personaje_edad_rango, personaje_sexo,
    fk_personaje, personaje_perfil_edad,
    componentes_servidos, cantidad_total_gramos,
    tiempo_decision_ms, tiempo_decision_segundos, orden_servicio,
    secuencia_clics, total_bebida_ml, bebida_slug,
    notas
  ) VALUES (
    v_sesion_id, v_momento,
    -- La vista respuestas_experimento expone personaje_tipo como personaje_nombre.
    LEFT(v_personaje_nombre, 50), v_edad_rango, v_personaje_genero,
    v_personaje_id, v_perfil_edad,
    j_alimentos, v_total_servidor,
    ROUND(v_segundos * 1000)::INTEGER, ROUND(v_segundos, 1), 1,
    j_clics, v_bebida_ml, v_bebida_slug,
    v_notas
  )
  RETURNING pk_decision INTO v_decision_id;

  RETURN jsonb_build_object(
    'success',         TRUE,
    'participante_id', v_participante_id,
    'sesion_id',       v_sesion_id,
    'decision_id',     v_decision_id
  );
END;
$fn$;

COMMENT ON FUNCTION registrar_respuesta_experimento(JSONB) IS
  'Envio consolidado del experimento (ADR-0001). Valida el PayloadEnvio de docs/CONTRATO-DATOS.md, recalcula los gramos desde Catalogo_alimentos e inserta participante, sesion y decision en una sola transaccion.';

---------------------------------------------------------------------------
-- Permisos: el participante (rol anon) solo puede ejecutar esta función,
-- nunca escribir en las tablas. Los roles anon/authenticated solo existen en
-- Supabase, así que el GRANT se salta en una instalación local de Postgres.
---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION registrar_respuesta_experimento(JSONB) FROM PUBLIC;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION registrar_respuesta_experimento(JSONB) TO anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION registrar_respuesta_experimento(JSONB) TO authenticated';
  END IF;
END
$do$;

-- Pendiente en el issue #7: retirar las políticas permisivas de
-- database/supabase_rls_anon.sql, que hoy dejan a anon escribir directamente en
-- las tablas y vuelven esquivable esta función. No se hace aquí porque el flujo
-- viejo sigue vivo hasta que la Vía B complete la pantalla de servicio.
