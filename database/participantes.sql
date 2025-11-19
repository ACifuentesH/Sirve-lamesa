-- Tabla de Participantes
-- Almacena datos sociodemográficos de los participantes del estudio

CREATE TABLE IF NOT EXISTS Participantes (
    PK_participante SERIAL PRIMARY KEY,
    
    -- Datos básicos (obligatorios del login)
    nombres VARCHAR(200) NOT NULL,
    edad INTEGER NOT NULL CHECK (edad > 0 AND edad < 150),
    sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('M', 'F', 'Otro')),
    
    -- Datos antropométricos (medidos por el investigador - OPCIONALES)
    peso_kg DECIMAL(5,2) CHECK (peso_kg > 0),
    altura_cm DECIMAL(5,2) CHECK (altura_cm > 0),
    imc DECIMAL(5,2), -- Índice de masa corporal calculado
    
    -- Datos geográficos (OPCIONALES)
    lugar_nacimiento VARCHAR(150),
    lugar_residencia VARCHAR(150),
    
    -- Datos socioeconómicos (OPCIONALES)
    ocupacion VARCHAR(150),
    nivel_socioeconomico VARCHAR(50), -- Escala Graffar modificada
    
    -- Instrumento psicológico (OPCIONAL)
    eat26_score INTEGER, -- Puntuación del EAT-26
    eat26_data JSONB, -- Respuestas detalladas del EAT-26 en formato JSON
    
    -- Metadata
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consentimiento_informado BOOLEAN DEFAULT FALSE,
    
    -- Datos adicionales opcionales
    notas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_participantes_nombres ON Participantes(nombres);
CREATE INDEX IF NOT EXISTS idx_participantes_edad ON Participantes(edad);
CREATE INDEX IF NOT EXISTS idx_participantes_sexo ON Participantes(sexo);
CREATE INDEX IF NOT EXISTS idx_participantes_fecha ON Participantes(fecha_registro);

