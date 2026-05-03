-- =============================================================================
-- Sirve la Mesa — RLS para usar solo Angular + Supabase (clave anon en el navegador)
-- =============================================================================
-- ADVERTENCIA DE SEGURIDAD: estas políticas permiten a cualquiera con la URL del
-- proyecto y la anon key leer/insertar/actualizar datos (equivalente a tener el
-- Express expuesto sin autenticación). Úsalo solo si ese riesgo es aceptable para
-- tu estudio (p. ej. URL no pública, datos ya anonimizados, etc.).
--
-- Cómo aplicar: Supabase Dashboard → SQL → New query → pegar → Run.
-- Requisito: tablas ya creadas en public (mismo esquema que database/*.sql).
-- =============================================================================

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_juego ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisiones_porcionamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE personajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE plato ENABLE ROW LEVEL SECURITY;
ALTER TABLE bebida ENABLE ROW LEVEL SECURITY;
ALTER TABLE porcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_plato ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_bebida ENABLE ROW LEVEL SECURITY;

-- Políticas rol anon (la que usa @supabase/supabase-js con la anon key)

CREATE POLICY "sirve_anon_all_participantes" ON participantes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "sirve_anon_all_sesiones" ON sesiones_juego FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "sirve_anon_all_decisiones" ON decisiones_porcionamiento FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "sirve_anon_select_personajes" ON personajes FOR SELECT TO anon USING (true);
CREATE POLICY "sirve_anon_select_componentes" ON componentes FOR SELECT TO anon USING (true);
CREATE POLICY "sirve_anon_select_menu" ON menu FOR SELECT TO anon USING (true);
CREATE POLICY "sirve_anon_select_plato" ON plato FOR SELECT TO anon USING (true);
CREATE POLICY "sirve_anon_select_bebida" ON bebida FOR SELECT TO anon USING (true);
CREATE POLICY "sirve_anon_select_porcion" ON porcion FOR SELECT TO anon USING (true);
CREATE POLICY "sirve_anon_select_menu_plato" ON menu_plato FOR SELECT TO anon USING (true);
CREATE POLICY "sirve_anon_select_menu_bebida" ON menu_bebida FOR SELECT TO anon USING (true);
