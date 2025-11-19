-- Migración: Cambiar el campo navegador de Sesiones_juego a TEXT
-- Fecha: 2025-11-19
-- Motivo: Los user agents modernos pueden exceder los 100 caracteres

-- Cambiar el campo navegador de VARCHAR(100) a TEXT (sin límite)
ALTER TABLE Sesiones_juego 
ALTER COLUMN navegador TYPE TEXT;

-- Comentario explicativo
COMMENT ON COLUMN Sesiones_juego.navegador IS 'User agent del navegador (sin límite de caracteres)';

