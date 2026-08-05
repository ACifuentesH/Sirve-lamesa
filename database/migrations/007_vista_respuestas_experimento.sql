-- Migración 007: vista respuestas_experimento (issue #5, ADR-0003)
-- Nombre exigido por la §7.2, como vista de SOLO LECTURA sobre el esquema
-- normalizado: una fila por decisión. Idempotente (CREATE OR REPLACE).
-- No debe ser legible para el rol anon (se restringe en el issue #7).

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
  d.timestamp_decision
FROM Decisiones_porcionamiento d
JOIN Sesiones_juego  s ON s.PK_sesion       = d.FK_sesion
JOIN Participantes   p ON p.PK_participante = s.FK_participante
ORDER BY p.PK_participante, s.PK_sesion, d.orden_servicio;
