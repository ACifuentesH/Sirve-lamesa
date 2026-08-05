# respuestas_experimento es una vista, no una tabla

La §7.2 del documento pide insertar en "una tabla llamada `respuestas_experimento`", pero nuestro esquema está normalizado en `Participantes` / `Sesiones_juego` / `Decisiones_porcionamiento`. Decidimos conservar las tablas normalizadas como única fuente de verdad y exponer una **vista SQL de solo lectura** llamada `respuestas_experimento` que aplana una fila por decisión: la Fundación consulta y exporta exactamente el nombre que pidió, nosotros mantenemos integridad referencial, y al ser una vista no puede desincronizarse.

La vista no es legible para el rol `anon` (ver ADR-0001 y el issue #7): solo investigadores autenticados.
