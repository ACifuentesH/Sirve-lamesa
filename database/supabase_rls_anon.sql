-- =============================================================================
-- RETIRADO — NO EJECUTAR. Se conserva solo como registro de lo que hubo aplicado.
-- =============================================================================
-- Estas políticas dan a `anon` acceso total (FOR ALL, USING true) a participantes,
-- sesiones_juego y decisiones_porcionamiento. Como la clave anon viaja en el
-- navegador y estuvo versionada en un repositorio público, esto equivalía a publicar
-- el estudio entero: cualquiera podía leerlo, alterarlo o borrarlo.
--
-- El ADR-0001 prohíbe expresamente este modelo. El RLS vigente son las migraciones
-- 009 (acotar a anon) y 013 (lectura solo para investigadores de la lista blanca); el
-- cierre definitivo, cuando el envío pase por la RPC, es la 012.
--
-- El bloque siguiente aborta el archivo a propósito: en el editor SQL todo corre en
-- una transacción, así que nada de lo que hay debajo llega a aplicarse.
-- =============================================================================

DO $$
BEGIN
  RAISE EXCEPTION
    'supabase_rls_anon.sql está retirado: reabriría el estudio a la clave anon. Aplica las migraciones 009 y 013 (ver docs/adr/0001-supabase-sin-express.md).';
END
$$;

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
