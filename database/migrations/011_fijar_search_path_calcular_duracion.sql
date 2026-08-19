-- Migración 011: fijar el search_path del trigger de duración de sesión.
--
-- Lo reportó el linter de Supabase (0011_function_search_path_mutable). Una función
-- con search_path mutable resuelve los nombres sin cualificar contra el search_path
-- de quien la dispara, así que quien pueda crear un esquema propio puede colar sus
-- objetos delante de los del esquema public.
--
-- El cuerpo es idéntico al original: solo se añade la cláusula SET.
-- Idempotente (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.calcular_duracion_sesion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
    IF NEW.fecha_fin IS NOT NULL AND OLD.fecha_fin IS NULL THEN
        NEW.duracion_total_segundos = EXTRACT(EPOCH FROM (NEW.fecha_fin - NEW.fecha_inicio))::INTEGER;
    END IF;
    RETURN NEW;
END;
$function$;
