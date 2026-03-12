-- Migración: anonimizar participantes y exigir datos antropométricos
-- Fecha: 2026-03-12
-- Motivo: no almacenar nombres por confidencialidad del estudio

-- Eliminar índice de nombres si existe
DROP INDEX IF EXISTS idx_participantes_nombres;

-- Eliminar columna de nombres (dato identificable)
ALTER TABLE Participantes
DROP COLUMN IF EXISTS nombres;

-- Asegurar que peso y altura sean obligatorios
ALTER TABLE Participantes
ALTER COLUMN peso_kg SET NOT NULL;

ALTER TABLE Participantes
ALTER COLUMN altura_cm SET NOT NULL;
