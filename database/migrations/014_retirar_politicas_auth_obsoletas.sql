-- Migración 014: retirar las políticas de lectura de la 009 que quedaron vivas.
--
-- Al aplicar la 013 sobre el proyecto, sus DROP no acertaron con los nombres: la 013
-- los deriva del nombre de la tabla (sirve_auth_select_sesiones_juego) y la 009 había
-- usado nombres cortos (sirve_auth_select_sesiones). Las políticas permisivas se
-- combinan con OR, así que mientras sobreviviera una con USING (true) cualquier
-- sesión iniciada seguía leyendo el estudio, lista blanca o no.
--
-- La 013 de este repositorio ya elimina ambos juegos de nombres, así que en una
-- instalación desde cero esto no encuentra nada que borrar. Se conserva para que el
-- historial del repositorio coincida con el del proyecto, donde sí hizo falta.
--
-- Idempotente.

DROP POLICY IF EXISTS "sirve_auth_select_sesiones"   ON sesiones_juego;
DROP POLICY IF EXISTS "sirve_auth_select_decisiones" ON decisiones_porcionamiento;
DROP POLICY IF EXISTS "sirve_auth_select_catalogo"   ON catalogo_alimentos;
