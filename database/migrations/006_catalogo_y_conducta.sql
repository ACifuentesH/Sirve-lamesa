-- Migración 006: catálogo de alimentos y variables de conducta (Módulos 5.2 y 7.1, issue #5)
-- Aditiva e idempotente.

-- Catálogo por momento del día (34 alimentos; los seeds llegan en el issue #15/B2).
CREATE TABLE IF NOT EXISTS Catalogo_alimentos (
  PK_alimento     SERIAL PRIMARY KEY,
  slug            VARCHAR(60)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  momento_dia     VARCHAR(20)  NOT NULL
                  CHECK (momento_dia IN ('desayuno','almuerzo','cena')),
  grupo           VARCHAR(80)  NOT NULL,   -- rótulo de la pestaña (cambia entre momentos)
  tipo            VARCHAR(40)  NOT NULL,   -- proteina | carbohidrato | vegetal | fruta | bebida | lacteo
  unidad_display  VARCHAR(80)  NOT NULL,   -- '1 rebanada' (lo único que ve el participante)
  peso_gramos     INTEGER      NOT NULL,   -- dato científico; jamás se muestra en la UI
  es_bebida       BOOLEAN      NOT NULL DEFAULT FALSE,
  imagen          VARCHAR(255) NOT NULL,
  orden           INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT uq_catalogo_slug_momento UNIQUE (slug, momento_dia)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_momento ON Catalogo_alimentos(momento_dia);

-- Personajes: alinear con la matriz de estímulos de la §4.1.
ALTER TABLE Personajes
  ADD COLUMN IF NOT EXISTS slug        VARCHAR(40),
  ADD COLUMN IF NOT EXISTS perfil_edad VARCHAR(30),
  ADD COLUMN IF NOT EXISTS pronombre   VARCHAR(10);

ALTER TABLE Personajes DROP CONSTRAINT IF EXISTS uq_personaje_slug;
ALTER TABLE Personajes ADD CONSTRAINT uq_personaje_slug UNIQUE (slug);

-- Conducta y resultado, según el árbol de la §7.1.
ALTER TABLE Decisiones_porcionamiento
  ADD COLUMN IF NOT EXISTS FK_personaje              INTEGER REFERENCES Personajes(PK_personaje),
  ADD COLUMN IF NOT EXISTS personaje_perfil_edad     VARCHAR(30),
  ADD COLUMN IF NOT EXISTS secuencia_clics           JSONB,
  ADD COLUMN IF NOT EXISTS tiempo_decision_segundos  DECIMAL(8,1),
  ADD COLUMN IF NOT EXISTS total_bebida_ml           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bebida_slug               VARCHAR(60);

CREATE INDEX IF NOT EXISTS idx_decisiones_clics
  ON Decisiones_porcionamiento USING GIN (secuencia_clics);
