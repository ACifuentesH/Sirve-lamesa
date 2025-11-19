-- Esquema de base de datos para "Sirve la Mesa"
-- Tablas del sistema de menús según el diagrama

-- Tabla Menu
CREATE TABLE IF NOT EXISTS Menu (
    PK_menu SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT unique_menu_nombre UNIQUE (nombre)
);

-- Tabla Plato
CREATE TABLE IF NOT EXISTS Plato (
    PK_plato SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT
);

-- Tabla Componentes (ingredientes/alimentos)
CREATE TABLE IF NOT EXISTS Componentes (
    PK_alimento SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT
);

-- Tabla Bebida
CREATE TABLE IF NOT EXISTS Bebida (
    PK_bebida SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla Porcion (relación entre Plato y Componentes)
CREATE TABLE IF NOT EXISTS Porcion (
    PK_porcion SERIAL PRIMARY KEY,
    FK_plato INTEGER NOT NULL REFERENCES Plato(PK_plato) ON DELETE CASCADE,
    FK_alimento INTEGER NOT NULL REFERENCES Componentes(PK_alimento) ON DELETE CASCADE,
    unidad_medida VARCHAR(50) DEFAULT 'gramos',
    cantidad INTEGER, -- Cantidad sugerida por defecto (opcional)
    CONSTRAINT unique_plato_componente UNIQUE (FK_plato, FK_alimento)
);

-- Tabla Menu_bebida (relación muchos a muchos entre Menu y Bebida)
CREATE TABLE IF NOT EXISTS Menu_bebida (
    FK_menu INTEGER NOT NULL REFERENCES Menu(PK_menu) ON DELETE CASCADE,
    FK_bebida INTEGER NOT NULL REFERENCES Bebida(PK_bebida) ON DELETE CASCADE,
    PRIMARY KEY (FK_menu, FK_bebida)
);

-- Tabla de relación entre Menu y Plato
CREATE TABLE IF NOT EXISTS Menu_plato (
    FK_menu INTEGER NOT NULL REFERENCES Menu(PK_menu) ON DELETE CASCADE,
    FK_plato INTEGER NOT NULL REFERENCES Plato(PK_plato) ON DELETE CASCADE,
    PRIMARY KEY (FK_menu, FK_plato)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_porcion_plato ON Porcion(FK_plato);
CREATE INDEX IF NOT EXISTS idx_porcion_alimento ON Porcion(FK_alimento);
CREATE INDEX IF NOT EXISTS idx_menu_bebida_menu ON Menu_bebida(FK_menu);
CREATE INDEX IF NOT EXISTS idx_menu_plato_menu ON Menu_plato(FK_menu);

