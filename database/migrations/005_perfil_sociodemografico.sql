-- Migración 005: perfil sociodemográfico del participante (Módulo 2, issue #5)
-- Aditiva e idempotente: puede ejecutarse más de una vez sin efecto adicional.
-- Las columnas nuevas quedan NULLABLE porque los registros históricos no las
-- tienen; la obligatoriedad la garantiza la RPC de envío (issue #6).
-- Nota: el DDL del Anexo A del plan incluía "ALTER COLUMN nombres DROP NOT NULL",
-- omitido aquí porque la columna se eliminó en la migración 002.

ALTER TABLE Participantes
  ADD COLUMN IF NOT EXISTS genero            VARCHAR(30),
  ADD COLUMN IF NOT EXISTS nivel_estudios    VARCHAR(40),
  ADD COLUMN IF NOT EXISTS semestre_o_anio   VARCHAR(40),
  ADD COLUMN IF NOT EXISTS etnia             VARCHAR(40),
  ADD COLUMN IF NOT EXISTS region_origen     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS region_residencia VARCHAR(100);

-- CHECK constraints: drop + add para idempotencia (Postgres no soporta
-- ADD CONSTRAINT IF NOT EXISTS). NULL pasa el CHECK: los históricos no fallan.
ALTER TABLE Participantes DROP CONSTRAINT IF EXISTS chk_genero;
ALTER TABLE Participantes ADD CONSTRAINT chk_genero CHECK (
  genero IN ('masculino','femenino','no_binario','prefiero_no_decir')
);

ALTER TABLE Participantes DROP CONSTRAINT IF EXISTS chk_nivel_estudios;
ALTER TABLE Participantes ADD CONSTRAINT chk_nivel_estudios CHECK (
  nivel_estudios IN ('pregrado_curso','pregrado_completo','posgrado','otro')
);

ALTER TABLE Participantes DROP CONSTRAINT IF EXISTS chk_etnia;
ALTER TABLE Participantes ADD CONSTRAINT chk_etnia CHECK (
  etnia IN ('latino_hispano','afrodescendiente','indigena','blanco','otro')
);

-- El documento sustituye la etiqueta "Sexo" por "Género": la columna legacy
-- deja de ser obligatoria (el registro nuevo ya no la captura).
ALTER TABLE Participantes ALTER COLUMN sexo DROP NOT NULL;
