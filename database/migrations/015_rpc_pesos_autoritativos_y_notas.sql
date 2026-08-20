-- Migración 015: el servidor manda sobre el desglose del plato, la constancia se
-- puede leer, y un reenvío no duplica la respuesta (issues #6 y #12).
--
-- Auditoría de la 008 contra los cuatro criterios del issue #6: los tres primeros
-- (inserción de 1+1+1 devolviendo ids, rollback sin huérfanos, rechazo descriptivo
-- de `porciones: 5` y del plato vacío) ya se cumplían y no se tocan. El cuarto se
-- cumplía a medias, por dos motivos:
--
--   1. La 008 recalcula `cantidad_total_gramos` desde Catalogo_alimentos, pero
--      guardaba `componentes_servidos` tal cual lo mandó el cliente. Ese JSONB lleva
--      `peso_unitario_g` y `peso_total_g` por alimento, y es de ahí —no del total—
--      de donde salen los gramos por alimento del export (issue #13) y las
--      categorías del panel de análisis (A8). Quedaba entonces una fila con el total
--      del servidor junto a un desglose del cliente que no tiene por qué sumar ese
--      total: precisamente el dato que el estudio analiza, sin verificar. Aquí cada
--      ítem se reescribe con el slug, nombre, tipo, grupo, unidad y peso del
--      catálogo, conservando la forma de AlimentoServido que congeló el contrato
--      (docs/CONTRATO-DATOS.md) para no romper a quien la consume.
--
--   2. La constancia se escribía en `Decisiones_porcionamiento.notas`, que no
--      formaba parte de `respuestas_experimento`. Siendo esa vista la superficie de
--      lectura y exportación del estudio (ADR-0003), la nota quedaba fuera del
--      camino por el que se miran los datos. Se añade la columna al final de la
--      vista, que es lo único que admite CREATE OR REPLACE VIEW.
--
-- De paso, un total no numérico en el payload (`"total_plato_gramos": "mucho"`)
-- reventaba el cast con un 22P02 opaco y se perdía la respuesta entera. Como la
-- regla 6 del contrato dice que en caso de discrepancia manda el servidor, ahora
-- eso se trata como discrepancia y se deja constancia, en vez de descartar la
-- participación por un bug del cliente.
--
-- ---------------------------------------------------------------------------
-- Idempotencia del envío (issue #12)
-- ---------------------------------------------------------------------------
-- Un timeout del cliente no significa "no se guardó", sino "no sé si se guardó":
-- la petición pudo llegar y la transacción confirmarse mientras se agotaban los
-- 15 s del cliente. El issue #12 verificó, ejecutando el EnvioService real contra
-- un Supabase falso, que hay tres caminos que reenvían (reintento automático tras
-- timeout, botón manual y reenvío tras recarga) y que con 20 s de latencia se
-- llegaban a escribir cuatro respuestas del mismo participante.
--
-- La mitad cliente ya está hecha: cada respuesta lleva un `envio_id` (UUID v4)
-- que se guarda junto al respaldo en localStorage, lo reutilizan todos los caminos
-- de reenvío y solo se borra tras confirmación. Viaja en la raíz del jsonb, fuera
-- de `PayloadEnvio`, que sigue congelado por el issue #2.
--
-- Aquí va la otra mitad: la clave se guarda con un índice UNIQUE, y un reenvío
-- devuelve los ids que ya se escribieron sin insertar nada.
--
-- Dónde vive la columna: en `Sesiones_juego`. Lo que se reenvía es la respuesta
-- completa (participante + sesión + decisión), así que la unicidad tiene que
-- cubrirla entera, y la sesión es la fila que la representa: cuelga del
-- participante y de ella cuelgan las decisiones, de modo que desde ella se llega a
-- los tres ids en un solo salto en cada sentido. Ponerla en
-- `Decisiones_porcionamiento` sería más frágil: esa tabla tiene `orden_servicio` y
-- el contrato deja abierta ASIGNACIONES_POR_PARTICIPANTE > 1 (issue #1), así que
-- el día que un envío traiga varias decisiones un UNIQUE sobre la decisión
-- rompería, mientras que sobre la sesión seguiría identificando el envío.
--
-- Compatibilidad: un `envio_id` ausente, nulo o mal formado NO tumba el envío. Se
-- guarda NULL y se inserta como siempre — un índice UNIQUE de Postgres admite
-- tantos NULL como haga falta, así que ni los históricos ni un cliente viejo
-- chocan entre sí ni con nadie. Lo único que se pierde para ese envío es la
-- protección contra duplicados, que es exactamente la situación de hoy: degradar
-- es preferible a rechazar una participación real por un UUID mal formado.
--
-- Idempotente (CREATE OR REPLACE / IF NOT EXISTS). Sustituye a la función de la
-- 008; aplicar después de ella.

---------------------------------------------------------------------------
-- 1. La columna que identifica el envío
---------------------------------------------------------------------------
ALTER TABLE Sesiones_juego
  ADD COLUMN IF NOT EXISTS envio_id UUID;

-- UNIQUE y nullable, no PRIMARY KEY ni NOT NULL: las filas históricas no tienen
-- envio_id y un cliente que no lo mande tiene que seguir pudiendo escribir.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sesiones_envio_id
  ON Sesiones_juego(envio_id);

COMMENT ON COLUMN Sesiones_juego.envio_id IS
  'UUID que genera el cliente por respuesta y reutiliza en cada reenvio (issue #12). Su indice UNIQUE es lo que impide que un timeout duplique la participacion. NULL en los historicos y en clientes que no lo mandan.';

---------------------------------------------------------------------------
-- 2. La función
---------------------------------------------------------------------------
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

  -- Idempotencia del envío (issue #12)
  v_envio_id     UUID;

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

  -- Fila del catálogo que respalda al ítem en curso
  v_cat_peso      INTEGER;
  v_cat_es_bebida BOOLEAN;
  v_cat_momento   TEXT;
  v_cat_slug      TEXT;
  v_cat_nombre    TEXT;
  v_cat_tipo      TEXT;
  v_cat_grupo     TEXT;
  v_cat_unidad    TEXT;

  -- Resultado del plato
  v_porciones       INTEGER;
  v_item_total      NUMERIC;
  v_total_servidor  NUMERIC := 0;
  v_total_cliente   NUMERIC;
  v_bebida_ml       INTEGER := 0;
  v_bebida_slug     TEXT    := NULL;
  v_bebida_cliente  NUMERIC;
  v_n_alimentos     INTEGER;
  v_n_distintos     INTEGER;
  v_alimentos_srv   JSONB   := '[]'::JSONB;
  v_items_corregidos INTEGER := 0;
  v_notas_partes    TEXT[]  := ARRAY[]::TEXT[];
  v_notas           TEXT    := NULL;

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
  -- 0.bis Reenvío: si esta respuesta ya se escribió, devolver lo que quedó
  --
  -- Va antes de validar el resto del payload a propósito. Si la respuesta ya está
  -- en la base, el reenvío tiene que salir bien: lo guardado guardado está, y
  -- fallar sobre ello solo provocaría más reintentos del cliente.
  --
  -- El CASE valida la forma del UUID en vez de castear a pelo porque `::UUID`
  -- lanza sobre una cadena mal formada, y un envio_id roto no puede costar una
  -- participación. Se acepta cualquier versión de UUID: exigir el nibble de v4 no
  -- añade unicidad y sí formas de rechazar un envío legítimo.
  ---------------------------------------------------------------------------
  v_envio_id := CASE
    WHEN jsonb_typeof(payload -> 'envio_id') = 'string'
     AND payload ->> 'envio_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (payload ->> 'envio_id')::UUID
    ELSE NULL
  END;

  IF v_envio_id IS NOT NULL THEN
    SELECT s.fk_participante, s.pk_sesion, d.pk_decision
      INTO v_participante_id, v_sesion_id, v_decision_id
      FROM sesiones_juego s
      LEFT JOIN decisiones_porcionamiento d ON d.fk_sesion = s.pk_sesion
     WHERE s.envio_id = v_envio_id
     ORDER BY d.orden_servicio, d.pk_decision
     LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success',         TRUE,
        'participante_id', v_participante_id,
        'sesion_id',       v_sesion_id,
        'decision_id',     v_decision_id,
        'duplicado',       TRUE
      );
    END IF;
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
  -- 4. Plato: validación y reconstrucción del desglose desde el catálogo
  --    (§5.3, §5.4). Nada de lo que sigue toma un gramo del cliente.
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

    SELECT peso_gramos, es_bebida, momento_dia, slug, nombre, tipo, grupo, unidad_display
      INTO v_cat_peso, v_cat_es_bebida, v_cat_momento, v_cat_slug, v_cat_nombre, v_cat_tipo, v_cat_grupo, v_cat_unidad
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

    v_item_total     := v_porciones * v_cat_peso;
    v_total_servidor := v_total_servidor + v_item_total;

    -- ¿El cliente declaraba otro peso para este alimento? Se anota para la
    -- constancia. El CASE, y no un OR, porque Postgres no garantiza el orden de
    -- evaluación de OR y el cast reventaría sobre un peso_total_g no numérico.
    IF CASE
         WHEN jsonb_typeof(j_item -> 'peso_total_g') = 'number'
           THEN (j_item ->> 'peso_total_g')::NUMERIC IS DISTINCT FROM v_item_total
         ELSE TRUE
       END
    THEN
      v_items_corregidos := v_items_corregidos + 1;
    END IF;

    -- Mismas claves que AlimentoServido (docs/CONTRATO-DATOS.md), para que el
    -- export y el panel sigan leyendo lo de siempre; solo que ahora los valores
    -- salen del catálogo. `cuadrante` es posición en pantalla, dato del cliente
    -- sin lectura científica, y se conserva tal cual.
    v_alimentos_srv := v_alimentos_srv || jsonb_build_array(jsonb_build_object(
      'alimento_id',     (j_item ->> 'alimento_id')::INTEGER,
      'slug',            v_cat_slug,
      'nombre',          v_cat_nombre,
      'tipo',            v_cat_tipo,
      'grupo',           v_cat_grupo,
      'porciones',       v_porciones,
      'unidad_display',  v_cat_unidad,
      'peso_unitario_g', v_cat_peso,
      'peso_total_g',    v_item_total,
      'cuadrante',       j_item -> 'cuadrante'
    ));
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
  --
  -- Un total ausente o no numérico se trata como discrepancia, no como error:
  -- el valor bueno ya lo tiene el servidor, y tirar la participación entera por
  -- un campo que de todos modos se iba a descartar sería perder un sujeto.
  ---------------------------------------------------------------------------
  v_total_cliente := CASE
    WHEN jsonb_typeof(j_plato -> 'total_plato_gramos') = 'number'
      THEN (j_plato ->> 'total_plato_gramos')::NUMERIC
    ELSE NULL
  END;

  v_bebida_cliente := CASE
    WHEN jsonb_typeof(j_plato -> 'total_bebida_ml') = 'number'
      THEN (j_plato ->> 'total_bebida_ml')::NUMERIC
    ELSE NULL
  END;

  IF v_total_cliente IS DISTINCT FROM v_total_servidor THEN
    v_notas_partes := v_notas_partes || format(
      'total_plato_gramos del cliente (%s) difiere del recalculado en servidor (%s); prevalece el del servidor.',
      COALESCE(v_total_cliente::TEXT, '(null)'), v_total_servidor::TEXT
    );
  END IF;

  IF v_bebida_cliente IS DISTINCT FROM v_bebida_ml THEN
    v_notas_partes := v_notas_partes || format(
      'total_bebida_ml del cliente (%s) difiere del recalculado en servidor (%s); prevalece el del servidor.',
      COALESCE(v_bebida_cliente::TEXT, '(null)'), v_bebida_ml::TEXT
    );
  END IF;

  IF v_items_corregidos > 0 THEN
    v_notas_partes := v_notas_partes || format(
      '%s de %s alimentos traian un peso distinto al del catalogo; componentes_servidos se guarda con los pesos del servidor.',
      v_items_corregidos, v_n_alimentos
    );
  END IF;

  v_notas := NULLIF(array_to_string(v_notas_partes, ' '), '');

  ---------------------------------------------------------------------------
  -- 7. Inserciones. Todo esto es una sola transacción: cualquier RAISE
  --    anterior o posterior deshace el conjunto completo.
  --
  -- El bloque envuelve las tres para poder atender la carrera que el corto
  -- circuito de arriba no ve: dos peticiones con el mismo envio_id a la vez. La
  -- segunda no encuentra nada al consultar, porque la primera todavía no ha
  -- confirmado, así que sigue adelante e intenta insertar; al llegar al índice
  -- UNIQUE se queda esperando a que la primera resuelva, y entonces o bien
  -- aquella confirmó y salta unique_violation —y aquí se devuelven sus ids— o
  -- bien abortó y esta inserta con normalidad. El rollback al savepoint deshace
  -- el participante recién escrito, así que tampoco por esta vía quedan
  -- huérfanos.
  ---------------------------------------------------------------------------
  BEGIN
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
      estado, dispositivo, navegador, resolucion_pantalla,
      envio_id
    ) VALUES (
      v_participante_id, v_fecha_inicio, v_ahora, v_duracion,
      'completada',
      LEFT(COALESCE(j_sesion ->> 'dispositivo', 'web'), 50),
      j_sesion ->> 'navegador',
      NULLIF(LEFT(COALESCE(j_sesion ->> 'resolucion_pantalla', ''), 20), ''),
      v_envio_id
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
      v_alimentos_srv, v_total_servidor,
      ROUND(v_segundos * 1000)::INTEGER, ROUND(v_segundos, 1), 1,
      j_clics, v_bebida_ml, v_bebida_slug,
      v_notas
    )
    RETURNING pk_decision INTO v_decision_id;

  EXCEPTION WHEN unique_violation THEN
    -- Sin envio_id la violación no puede ser la de nuestro índice: que suba tal
    -- cual, sin disfrazarla de reenvío.
    IF v_envio_id IS NULL THEN
      RAISE;
    END IF;

    -- Esta consulta ve la fila de la otra transacción porque toma una instantánea
    -- nueva: PostgREST trabaja en READ COMMITTED, y para que saltara
    -- unique_violation aquella tuvo que confirmar antes.
    SELECT s.fk_participante, s.pk_sesion, d.pk_decision
      INTO v_participante_id, v_sesion_id, v_decision_id
      FROM sesiones_juego s
      LEFT JOIN decisiones_porcionamiento d ON d.fk_sesion = s.pk_sesion
     WHERE s.envio_id = v_envio_id
     ORDER BY d.orden_servicio, d.pk_decision
     LIMIT 1;

    -- Si la violación era de otra restricción no hay nada que devolver, y el
    -- error original tiene que llegar al cliente entero.
    IF NOT FOUND THEN
      RAISE;
    END IF;

    RETURN jsonb_build_object(
      'success',         TRUE,
      'participante_id', v_participante_id,
      'sesion_id',       v_sesion_id,
      'decision_id',     v_decision_id,
      'duplicado',       TRUE
    );
  END;

  -- `duplicado` no forma parte de RespuestaEnvio (contrato congelado, issue #2) y
  -- el cliente no necesita leerlo. Se añade porque distinguir un alta real de un
  -- reenvío absorbido es justo lo que hará falta para auditar los duplicados que
  -- motivaron todo esto, y una clave de más en el jsonb no rompe la interfaz de
  -- TypeScript, que sencillamente no la mira.
  RETURN jsonb_build_object(
    'success',         TRUE,
    'participante_id', v_participante_id,
    'sesion_id',       v_sesion_id,
    'decision_id',     v_decision_id,
    'duplicado',       FALSE
  );
END;
$fn$;

COMMENT ON FUNCTION registrar_respuesta_experimento(JSONB) IS
  'Envio consolidado del experimento (ADR-0001). Valida el PayloadEnvio de docs/CONTRATO-DATOS.md, reconstruye el desglose del plato y sus gramos desde Catalogo_alimentos, y escribe participante, sesion y decision en una sola transaccion. Toda discrepancia con lo declarado por el cliente queda anotada en Decisiones_porcionamiento.notas.';

---------------------------------------------------------------------------
-- 3. Permisos
--
-- CREATE OR REPLACE FUNCTION conserva el ACL existente, así que sobre una base
-- que ya tenga la 008 esto no cambia nada. Se repite para que la migración valga
-- por sí sola si alguien la aplica sobre una función recreada a mano.
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

---------------------------------------------------------------------------
-- 4. La vista, con la constancia a la vista
--
-- Idéntica a la de la 007 salvo `notas`, añadida al final: CREATE OR REPLACE VIEW
-- exige que las columnas previas conserven nombre, tipo y orden, y solo admite
-- columnas nuevas por la cola. `api.service.ts` consulta con select('*') y el
-- export enumera las columnas que usa, así que ninguno de los dos se entera.
---------------------------------------------------------------------------
CREATE OR REPLACE VIEW respuestas_experimento AS
SELECT
  d.PK_decision                      AS decision_id,
  -- PARTICIPANTE
  p.PK_participante                  AS participante_id,
  p.edad                             AS participante_edad,
  p.peso_kg                          AS participante_peso_kg,
  p.altura_cm                        AS participante_altura_cm,
  p.imc                              AS participante_imc,
  p.genero                           AS participante_genero,
  p.nivel_estudios                   AS participante_nivel_estudios,
  p.semestre_o_anio                  AS participante_semestre,
  p.etnia                            AS participante_etnia,
  p.region_origen                    AS participante_region_origen,
  p.region_residencia                AS participante_region_residencia,
  -- CONTEXTO ASIGNADO
  d.FK_personaje                     AS personaje_id,
  d.personaje_tipo                   AS personaje_nombre,
  d.personaje_perfil_edad,
  d.personaje_edad_rango,
  d.personaje_sexo                   AS personaje_genero,
  d.escenario                        AS momento_dia,
  -- CONDUCTA
  d.tiempo_decision_segundos,
  d.secuencia_clics,
  -- RESULTADO DEL PLATO
  d.componentes_servidos,
  d.cantidad_total_gramos            AS total_plato_gramos,
  d.total_bebida_ml,
  d.bebida_slug,
  -- SESIÓN
  s.PK_sesion                        AS sesion_id,
  s.fecha_inicio,
  s.fecha_fin,
  s.duracion_total_segundos,
  s.estado                           AS sesion_estado,
  s.dispositivo,
  s.resolucion_pantalla,
  d.timestamp_decision,
  -- AUDITORÍA: constancia de lo que el servidor corrigió al cliente (issue #6).
  d.notas
FROM Decisiones_porcionamiento d
JOIN Sesiones_juego  s ON s.PK_sesion       = d.FK_sesion
JOIN Participantes   p ON p.PK_participante = s.FK_participante
ORDER BY p.PK_participante, s.PK_sesion, d.orden_servicio;

-- Mismo blindaje de la 007: security_invoker para que la vista respete el RLS de
-- quien consulta, y nada de lectura para anon. CREATE OR REPLACE conserva ambos,
-- pero se reafirman por si la vista se recreó por fuera de la migración.
DO $do$
BEGIN
  IF current_setting('server_version_num')::INTEGER >= 150000 THEN
    EXECUTE 'ALTER VIEW respuestas_experimento SET (security_invoker = true)';
  ELSE
    RAISE NOTICE 'Postgres < 15: sin security_invoker; la vista se protege solo por GRANT';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON respuestas_experimento FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT SELECT ON respuestas_experimento TO authenticated';
  END IF;
END
$do$;
