-- Tabla de Decisiones de Porcionamiento
-- Registra cada decisión individual de servir comida a un personaje sintético

CREATE TABLE IF NOT EXISTS Decisiones_porcionamiento (
    PK_decision SERIAL PRIMARY KEY,
    FK_sesion INTEGER NOT NULL REFERENCES Sesiones_juego(PK_sesion) ON DELETE CASCADE,
    
    -- Contexto de la decisión
    escenario VARCHAR(20) NOT NULL CHECK (escenario IN ('desayuno', 'almuerzo', 'cena')),
    
    -- Personaje sintético servido
    personaje_tipo VARCHAR(50) NOT NULL, -- 'niño', 'niña', 'adolescente_hombre', 'adolescente_mujer', 'adulto_joven_hombre', 'adulto_joven_mujer', 'adulto_hombre', 'adulto_mujer'
    personaje_edad_rango VARCHAR(20), -- '6-11', '12-17', '18-25', '30-50'
    personaje_sexo VARCHAR(1) CHECK (personaje_sexo IN ('M', 'F')),
    
    -- Qué se sirvió
    FK_plato INTEGER REFERENCES Plato(PK_plato),
    FK_bebida INTEGER REFERENCES Bebida(PK_bebida),
    
    -- Componentes y cantidades (almacenado como JSON para flexibilidad)
    -- Formato: [{"componente_id": 1, "nombre": "arroz", "cantidad_gramos": 150}, ...]
    componentes_servidos JSONB NOT NULL,
    
    -- Cantidad total servida
    cantidad_total_gramos DECIMAL(8,2),
    
    -- Métricas de tiempo
    tiempo_decision_ms INTEGER, -- Tiempo que tardó en tomar la decisión (milisegundos)
    orden_servicio INTEGER, -- En qué orden sirvió a este personaje (1, 2, 3, ...)
    
    -- Timestamp
    timestamp_decision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Datos adicionales
    notas TEXT
);

-- Índices para análisis
CREATE INDEX IF NOT EXISTS idx_decisiones_sesion ON Decisiones_porcionamiento(FK_sesion);
CREATE INDEX IF NOT EXISTS idx_decisiones_escenario ON Decisiones_porcionamiento(escenario);
CREATE INDEX IF NOT EXISTS idx_decisiones_personaje_tipo ON Decisiones_porcionamiento(personaje_tipo);
CREATE INDEX IF NOT EXISTS idx_decisiones_personaje_sexo ON Decisiones_porcionamiento(personaje_sexo);
CREATE INDEX IF NOT EXISTS idx_decisiones_plato ON Decisiones_porcionamiento(FK_plato);
CREATE INDEX IF NOT EXISTS idx_decisiones_orden ON Decisiones_porcionamiento(orden_servicio);

-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_decisiones_componentes ON Decisiones_porcionamiento USING GIN (componentes_servidos);

