-- Tabla de Sesiones de Juego
-- Registra cada sesión de juego realizada por un participante

CREATE TABLE IF NOT EXISTS Sesiones_juego (
    PK_sesion SERIAL PRIMARY KEY,
    FK_participante INTEGER NOT NULL REFERENCES Participantes(PK_participante) ON DELETE CASCADE,
    
    -- Timestamps
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    
    -- Duración total de la sesión en segundos
    duracion_total_segundos INTEGER,
    
    -- Estado de la sesión
    estado VARCHAR(20) DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'completada', 'abandonada')),
    
    -- Metadata
    dispositivo VARCHAR(50), -- web, desktop, etc.
    navegador TEXT, -- User agent del navegador (sin límite de caracteres)
    resolucion_pantalla VARCHAR(20),
    
    -- Datos adicionales
    notas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sesiones_participante ON Sesiones_juego(FK_participante);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha_inicio ON Sesiones_juego(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON Sesiones_juego(estado);

-- Trigger para calcular duración automáticamente
CREATE OR REPLACE FUNCTION calcular_duracion_sesion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_fin IS NOT NULL AND OLD.fecha_fin IS NULL THEN
        NEW.duracion_total_segundos = EXTRACT(EPOCH FROM (NEW.fecha_fin - NEW.fecha_inicio))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger si existe antes de crearlo
DROP TRIGGER IF EXISTS trigger_calcular_duracion ON Sesiones_juego;

CREATE TRIGGER trigger_calcular_duracion
BEFORE UPDATE ON Sesiones_juego
FOR EACH ROW
EXECUTE FUNCTION calcular_duracion_sesion();

