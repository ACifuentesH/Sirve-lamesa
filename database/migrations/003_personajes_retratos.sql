-- Personajes familia + niños (misma edad 8-12 para Matías y Pedro; figura IMC en imc_representado)
ALTER TABLE Personajes ADD COLUMN IF NOT EXISTS imc_representado VARCHAR(20);
ALTER TABLE decisiones_porcionamiento ADD COLUMN IF NOT EXISTS personaje_imc_representado VARCHAR(20);

DELETE FROM Personajes;

INSERT INTO Personajes (tipo, edad_rango, sexo, imagen, nombre, imc_representado) VALUES
    ('adulto_hombre', '65+', 'M', 'Juan.png', 'Juan', 'no_aplica'),
    ('adulto_mujer', '65+', 'F', 'Rosa.png', 'Rosa', 'no_aplica'),
    ('adulto_mujer', '40-55', 'F', 'Claudia.png', 'Claudia', 'no_aplica'),
    ('adulto_hombre', '40-55', 'M', 'Luis.png', 'Luis', 'no_aplica'),
    ('niña', '8-12', 'F', 'Sofia.png', 'Sofia', 'normopeso'),
    ('niño', '8-12', 'M', 'matias.png', 'Matias', 'sobrepeso'),
    ('niño', '8-12', 'M', 'pedro.png', 'Pedro', 'normopeso');
