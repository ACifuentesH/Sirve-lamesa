---------------------------------------------------------------------------
-- 017_notas_decisiones_porcionamiento.sql — issue #46
--
-- QUÉ ARREGLA, Y PARA QUIÉN
--
-- Las RPC escriben en `Decisiones_porcionamiento.notas`: la 008 en las líneas 411
-- y 420, y la 015 en la 607. La 015 además expone esa columna en la vista
-- `respuestas_experimento` (ADR-0003), así que no es un campo interno: es campo de
-- lectura del estudio.
--
-- Ninguna migración de la serie 001..016 la creaba. Solo existía en el fichero
-- suelto `database/decisiones_porcionamiento.sql:36`, fuera de la serie numerada.
--
-- Esta migración y la 000 arreglan el problema para DOS poblaciones distintas, y
-- por eso hacen falta las dos:
--
--   * La 000 crea la tabla entera —`notas` incluida— y sirve a las INSTALACIONES
--     NUEVAS, que antes ni siquiera llegaban hasta aquí: fallaban en la 001.
--
--   * Esta 017 sirve a las BASES YA DESPLEGADAS, que se construyeron a mano desde
--     los ficheros sueltos. Ahí la tabla ya existe, así que la 000 no la toca, y la
--     única forma de garantizar la columna es un ALTER idempotente.
--
-- Sobre una base que ya tenga la columna esto no cambia nada.
--
-- ALCANCE DE LA AUDITORÍA (issue #46 pedía comprobar si `notas` era la única)
--
-- Se cruzaron todas las columnas que la RPC de la 015 escribe en
-- `Decisiones_porcionamiento` contra lo que crea la serie numerada:
--
--   fk_personaje ............. la crea la 006
--   personaje_perfil_edad .... la crea la 006
--   tiempo_decision_segundos . la crea la 006
--   secuencia_clics .......... la crea la 006
--   total_bebida_ml .......... la crea la 006
--   bebida_slug .............. la crea la 006
--   notas .................... NO LA CREABA NADIE  <- esta migración
--
-- Mismo cruce sobre `participantes` (edad, peso_kg, altura_cm, imc,
-- consentimiento_informado del esquema base; genero, nivel_estudios,
-- semestre_o_anio, etnia, region_origen, region_residencia de la 005) y sobre
-- `sesiones_juego` (columnas del esquema base, más `envio_id` de la 015): todas
-- cubiertas.
--
-- Conclusión: `notas` era la única. La sospecha del issue de que hubiera más no se
-- confirma para el conjunto de columnas que las RPC escriben de verdad.
---------------------------------------------------------------------------

ALTER TABLE Decisiones_porcionamiento
  ADD COLUMN IF NOT EXISTS notas TEXT;

COMMENT ON COLUMN Decisiones_porcionamiento.notas IS
  'Constancia de auditoria escrita por registrar_respuesta_experimento: recoge las discrepancias entre lo que declaro el cliente y lo que el servidor recalculo desde Catalogo_alimentos. Expuesta en la vista respuestas_experimento (ADR-0003), es campo de lectura del estudio.';
