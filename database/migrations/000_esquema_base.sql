---------------------------------------------------------------------------
-- 000_esquema_base.sql — issue #46
--
-- POR QUÉ EXISTE ESTA MIGRACIÓN
--
-- `INICIALIZACION-BD.md` dice que el esquema se construye "aplicando migraciones
-- en orden y después los seeds". Eso no era cierto: la serie numerada solo creaba
-- DOS de las trece tablas (`Catalogo_alimentos` en la 006 e `investigadores` en la
-- 013). Las once restantes vivían en ficheros sueltos fuera de la serie
-- (`database/schema.sql`, `participantes.sql`, `sesiones_juego.sql`,
-- `decisiones_porcionamiento.sql`), que la documentación ni siquiera mencionaba.
--
-- Consecuencia: una instalación desde cero siguiendo el camino documentado no
-- fallaba en la columna `notas` como decía el issue #46 — fallaba mucho antes, en
-- la propia `001_ampliar_campo_navegador.sql`, porque `Sesiones_juego` todavía no
-- existía. Todo lo que viene después heredaba el fallo.
--
-- Esta migración mete el esquema base DENTRO de la serie, delante de la 001, que
-- es el único sitio desde el que puede arreglar el problema: una migración con
-- número alto no puede crear tablas que las migraciones anteriores ya intentaron
-- alterar.
--
-- POR QUÉ NO REUTILIZA `database/schema.sql` TAL CUAL
--
-- Porque ese fichero empieza con once `DROP TABLE ... CASCADE`. Es exactamente el
-- peligro por el que se retiró `init-database.js` en el issue #24: hoy hay
-- decisiones de participantes ya recogidas, y aplicar eso contra la base real las
-- borraría sin aviso. Aquí se conservan los `CREATE TABLE IF NOT EXISTS` y se
-- descartan los `DROP`. La migración es idempotente y NO DESTRUCTIVA: sobre la base
-- real —que ya tiene todas estas tablas— no cambia absolutamente nada.
--
-- ORDEN: las tablas van en orden de dependencia de claves ajenas.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
-- 1. Catálogo de menús (de database/schema.sql, sin los DROP)
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Menu (
    PK_menu SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT unique_menu_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS Plato (
    PK_plato SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS Componentes (
    PK_alimento SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255),
    categoria VARCHAR(50),
    unidad VARCHAR(50) DEFAULT 'gramos',
    porcion_default INTEGER
);

-- `imc_representado` lo vuelve a añadir la 003 con ADD COLUMN IF NOT EXISTS; aquí
-- se crea ya con su DEFAULT, así que allí queda en no-op.
CREATE TABLE IF NOT EXISTS Personajes (
    PK_personaje SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    edad_rango VARCHAR(20) NOT NULL,
    sexo VARCHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    imagen VARCHAR(255),
    nombre VARCHAR(150) NOT NULL,
    imc_representado VARCHAR(20) DEFAULT 'no_aplica'
);

CREATE TABLE IF NOT EXISTS Bebida (
    PK_bebida SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS Porcion (
    PK_porcion SERIAL PRIMARY KEY,
    FK_plato INTEGER NOT NULL REFERENCES Plato(PK_plato) ON DELETE CASCADE,
    FK_alimento INTEGER NOT NULL REFERENCES Componentes(PK_alimento) ON DELETE CASCADE,
    unidad_medida VARCHAR(50) DEFAULT 'gramos',
    cantidad INTEGER,
    CONSTRAINT unique_plato_componente UNIQUE (FK_plato, FK_alimento)
);

CREATE TABLE IF NOT EXISTS Menu_bebida (
    FK_menu INTEGER NOT NULL REFERENCES Menu(PK_menu) ON DELETE CASCADE,
    FK_bebida INTEGER NOT NULL REFERENCES Bebida(PK_bebida) ON DELETE CASCADE,
    PRIMARY KEY (FK_menu, FK_bebida)
);

CREATE TABLE IF NOT EXISTS Menu_plato (
    FK_menu INTEGER NOT NULL REFERENCES Menu(PK_menu) ON DELETE CASCADE,
    FK_plato INTEGER NOT NULL REFERENCES Plato(PK_plato) ON DELETE CASCADE,
    PRIMARY KEY (FK_menu, FK_plato)
);

---------------------------------------------------------------------------
-- 2. Participantes (de database/participantes.sql)
--
-- Se crea en su forma ANONIMIZADA: sin `nombres` ni `apellidos`. La 002 los
-- retira con DROP COLUMN IF EXISTS, así que allí queda en no-op sobre una base
-- nueva y sigue funcionando sobre una base vieja que aún los tenga.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Participantes (
    PK_participante SERIAL PRIMARY KEY,

    edad INTEGER NOT NULL CHECK (edad > 0 AND edad < 150),
    sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('M', 'F', 'Otro')),

    peso_kg DECIMAL(5,2) NOT NULL CHECK (peso_kg > 0),
    altura_cm DECIMAL(5,2) NOT NULL CHECK (altura_cm > 0),
    imc DECIMAL(5,2),

    lugar_nacimiento VARCHAR(150),
    lugar_residencia VARCHAR(150),

    ocupacion VARCHAR(150),
    nivel_socioeconomico VARCHAR(50),

    eat26_score INTEGER,
    eat26_data JSONB,

    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consentimiento_informado BOOLEAN DEFAULT FALSE,

    notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_participantes_edad ON Participantes(edad);
CREATE INDEX IF NOT EXISTS idx_participantes_sexo ON Participantes(sexo);
CREATE INDEX IF NOT EXISTS idx_participantes_fecha ON Participantes(fecha_registro);

---------------------------------------------------------------------------
-- 3. Sesiones de juego (de database/sesiones_juego.sql)
--
-- `navegador` se crea ya como TEXT, que es justo lo que hace la 001; allí queda
-- en no-op sobre una base nueva.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Sesiones_juego (
    PK_sesion SERIAL PRIMARY KEY,
    FK_participante INTEGER NOT NULL REFERENCES Participantes(PK_participante) ON DELETE CASCADE,

    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,

    duracion_total_segundos INTEGER,

    estado VARCHAR(20) DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'completada', 'abandonada')),

    dispositivo VARCHAR(50),
    navegador TEXT,
    resolucion_pantalla VARCHAR(20),

    notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_sesiones_participante ON Sesiones_juego(FK_participante);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha_inicio ON Sesiones_juego(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON Sesiones_juego(estado);

-- El `search_path` de esta función lo fija la 011. Aquí se crea tal como estaba en
-- el fichero suelto para no adelantar ese cambio y que la 011 siga teniendo sentido.
CREATE OR REPLACE FUNCTION calcular_duracion_sesion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_fin IS NOT NULL AND OLD.fecha_fin IS NULL THEN
        NEW.duracion_total_segundos = EXTRACT(EPOCH FROM (NEW.fecha_fin - NEW.fecha_inicio))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_duracion ON Sesiones_juego;

CREATE TRIGGER trigger_calcular_duracion
BEFORE UPDATE ON Sesiones_juego
FOR EACH ROW
EXECUTE FUNCTION calcular_duracion_sesion();

---------------------------------------------------------------------------
-- 4. Decisiones de porcionamiento (de database/decisiones_porcionamiento.sql)
--
-- Esta es la tabla del issue #46. `notas` se crea aquí, que es donde la serie
-- numerada la necesitaba: las RPC de la 008 (líneas 411 y 420) y de la 015
-- (línea 607) escriben en ella, y la 015 la expone en `respuestas_experimento`
-- (ADR-0003), así que es campo de lectura del estudio.
--
-- `personaje_imc_representado` lo vuelve a añadir la 003 con ADD COLUMN IF NOT
-- EXISTS; allí queda en no-op.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Decisiones_porcionamiento (
    PK_decision SERIAL PRIMARY KEY,
    FK_sesion INTEGER NOT NULL REFERENCES Sesiones_juego(PK_sesion) ON DELETE CASCADE,

    escenario VARCHAR(20) NOT NULL CHECK (escenario IN ('desayuno', 'almuerzo', 'cena')),

    personaje_tipo VARCHAR(50) NOT NULL,
    personaje_edad_rango VARCHAR(20),
    personaje_sexo VARCHAR(1) CHECK (personaje_sexo IN ('M', 'F')),
    personaje_imc_representado VARCHAR(20),

    FK_plato INTEGER REFERENCES Plato(PK_plato),
    FK_bebida INTEGER REFERENCES Bebida(PK_bebida),

    componentes_servidos JSONB NOT NULL,

    cantidad_total_gramos DECIMAL(8,2),

    tiempo_decision_ms INTEGER,
    orden_servicio INTEGER,

    timestamp_decision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_decisiones_sesion ON Decisiones_porcionamiento(FK_sesion);
CREATE INDEX IF NOT EXISTS idx_decisiones_escenario ON Decisiones_porcionamiento(escenario);
CREATE INDEX IF NOT EXISTS idx_decisiones_personaje_tipo ON Decisiones_porcionamiento(personaje_tipo);
CREATE INDEX IF NOT EXISTS idx_decisiones_personaje_sexo ON Decisiones_porcionamiento(personaje_sexo);
CREATE INDEX IF NOT EXISTS idx_decisiones_plato ON Decisiones_porcionamiento(FK_plato);
CREATE INDEX IF NOT EXISTS idx_decisiones_orden ON Decisiones_porcionamiento(orden_servicio);

CREATE INDEX IF NOT EXISTS idx_decisiones_componentes ON Decisiones_porcionamiento USING GIN (componentes_servidos);
