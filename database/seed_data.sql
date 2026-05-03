-- Datos iniciales del menú basados en el anexo del proyecto
-- Menú del restaurante El Solar del Este, Las Mercedes

-- ===================================
-- PERSONAJES SINTÉTICOS
-- ===================================
-- Retratos en assets/images/ (columna imagen = nombre de archivo). imc_representado: normopeso | sobrepeso | no_aplica
INSERT INTO Personajes (tipo, edad_rango, sexo, imagen, nombre, imc_representado) VALUES
    ('adulto_hombre', '65+', 'M', 'Juan.png', 'Juan', 'no_aplica'),
    ('adulto_mujer', '65+', 'F', 'Rosa.png', 'Rosa', 'no_aplica'),
    ('adulto_mujer', '40-55', 'F', 'Claudia.png', 'Claudia', 'no_aplica'),
    ('adulto_hombre', '40-55', 'M', 'Luis.png', 'Luis', 'no_aplica'),
    ('niña', '8-12', 'F', 'Sofia.png', 'Sofia', 'normopeso'),
    ('niño', '8-12', 'M', 'matias.png', 'Matias', 'sobrepeso'),
    ('niño', '8-12', 'M', 'pedro.png', 'Pedro', 'normopeso');

-- ===================================
-- MENÚS PRINCIPALES
-- ===================================
INSERT INTO Menu (nombre) VALUES 
    ('Desayuno'),
    ('Almuerzo'),
    ('Cena')
ON CONFLICT (nombre) DO NOTHING;

-- ===================================
-- BEBIDAS
-- ===================================
INSERT INTO Bebida (nombre, descripcion) VALUES
    -- Café
    ('Café negro', 'Café negro sin leche'),
    ('Café con leche', 'Café con leche'),
    ('Café marrón', 'Café marrón oscuro'),
    
    -- Jugos naturales
    ('Jugo de naranja', 'Jugo natural de naranja'),
    ('Jugo de guayaba', 'Jugo natural de guayaba'),
    ('Jugo de lechosa', 'Jugo natural de papaya'),
    ('Jugo de melón', 'Jugo natural de melón'),
    ('Jugo de mango', 'Jugo natural de mango'),
    ('Jugo de parchita', 'Jugo natural de maracuyá'),
    ('Jugo de patilla', 'Jugo natural de sandía'),
    ('Jugo de fresa', 'Jugo natural de fresa'),
    ('Jugo de mora', 'Jugo natural de mora'),
    
    -- Refrescos
    ('Pepsi', 'Refresco de cola Pepsi'),
    ('Coca-Cola', 'Refresco de cola Coca-Cola'),
    ('Malta', 'Bebida de malta'),
    ('Colita', 'Refresco sabor cola'),
    ('Naranja (refresco)', 'Refresco sabor naranja'),
    ('7up', 'Refresco de lima-limón'),
    ('Chinotto', 'Refresco amargo italiano')
ON CONFLICT DO NOTHING;

-- ===================================
-- COMPONENTES (INGREDIENTES)
-- ===================================
-- Ingredientes con imágenes del frontend y categorías
INSERT INTO Componentes (nombre, descripcion, imagen, categoria, unidad, porcion_default) VALUES
    -- Proteínas del frontend
    ('Pollo', 'Pollo', 'muslo_de_pollo.png', 'proteina', 'gramos', 120),
    ('Bistecs', 'Bistecs de res', 'bistecs.png', 'proteina', 'gramos', 150),
    ('Huevo', 'Huevo', 'huevo_frito.png', 'proteina', 'unidad', 1),
    ('Tocineta', 'Tocineta frita', 'tocineta.png', 'proteina', 'gramos', 30),
    
    -- Carbohidratos del frontend
    ('Arroz', 'Arroz cocido', 'arroz.png', 'carbohidrato', 'gramos', 150),
    ('Plátano', 'Plátano', 'platano.png', 'carbohidrato', 'gramos', 100),
    ('Papa', 'Papa cocida o frita', 'papa.png', 'carbohidrato', 'gramos', 150),
    ('Granos', 'Granos cocidos', 'granos.png', 'carbohidrato', 'gramos', 120),
    ('Pan', 'Pan', 'pan tostado.png', 'carbohidrato', 'rebanadas', 1),
    
    -- Vegetales del frontend
    ('Tomate', 'Tomate fresco en rodaja', 'tomate.png', 'vegetal', 'rebanadas', 1),
    ('Lechuga', 'Lechuga fresca', 'lechuga.png', 'vegetal', 'gramos', 50),
    ('Brócoli', 'Brócoli', 'brocoli.png', 'vegetal', 'gramos', 80),
    ('Zanahoria', 'Zanahoria cocida', 'zanahoria.png', 'vegetal', 'gramos', 80),
    ('Pepino', 'Pepino fresco', 'pepino.png', 'vegetal', 'gramos', 50),
    
    -- Frutas del frontend
    ('Naranja', 'Naranja fresca', 'naranja.png', 'fruta', 'unidad', 1),
    ('Lechosa', 'Lechosa/Papaya en rebanadas', 'lechosa.png', 'fruta', 'rebanadas', 1),
    ('Cambur', 'Cambur', 'cambur.png', 'fruta', 'unidad', 1),
    ('Fresa', 'Fresas frescas', 'fresa.png', 'fruta', 'gramos', 100),
    ('Piña', 'Piña fresca en rebanadas', 'pina.png', 'fruta', 'rebanadas', 1),
    
    -- Ingredientes adicionales del menú venezolano (sin imagen del frontend)
    ('Queso blanco', 'Queso blanco fresco', NULL, 'proteina', 'gramos', 50),
    ('Queso amarillo', 'Queso amarillo tipo cheddar', NULL, 'proteina', 'gramos', 50),
    ('Queso guayanés', 'Queso guayanés artesanal', NULL, 'proteina', 'gramos', 50),
    ('Queso de mano', 'Queso de mano venezolano', NULL, 'proteina', 'gramos', 50),
    ('Queso telita', 'Queso telita suave', NULL, 'proteina', 'gramos', 50),
    ('Jamón', 'Jamón de pierna', NULL, 'proteina', 'gramos', 50),
    ('Perico', 'Huevos revueltos con tomate y cebolla', NULL, 'proteina', 'gramos', 100),
    ('Carne mechada', 'Carne de res desmechada', NULL, 'proteina', 'gramos', 80),
    ('Pernil', 'Pernil de cerdo', NULL, 'proteina', 'gramos', 80),
    ('Carne molida', 'Carne molida de res', NULL, 'proteina', 'gramos', 80),
    ('Pollo desmechado', 'Pollo desmenuzado', NULL, 'proteina', 'gramos', 80),
    ('Chorizo', 'Chorizo español', NULL, 'proteina', 'gramos', 50),
    ('Atún', 'Atún enlatado', NULL, 'proteina', 'gramos', 60),
    ('Cazón', 'Pescado cazón', NULL, 'proteina', 'gramos', 100),
    ('Pavo', 'Pavo en lonchas', NULL, 'proteina', 'gramos', 50),
    ('Queso crema', 'Queso crema untable', NULL, 'proteina', 'gramos', 30),
    
    -- Carbohidratos adicionales
    ('Arepa', 'Arepa de maíz', NULL, 'carbohidrato', 'unidad', 1),
    ('Empanada (masa)', 'Masa de empanada frita', NULL, 'carbohidrato', 'unidad', 1),
    ('Cachapa', 'Cachapa de maíz', NULL, 'carbohidrato', 'unidad', 1),
    ('Pan de sandwich', 'Pan de molde para sandwich', NULL, 'carbohidrato', 'rebanadas', 2),
    ('Pastelito (masa)', 'Masa de pastelito frita', NULL, 'carbohidrato', 'unidad', 1),
    ('Cachito (masa)', 'Croissant venezolano', NULL, 'carbohidrato', 'unidad', 1),
    ('Arroz blanco', 'Arroz blanco cocido', NULL, 'carbohidrato', 'gramos', 150),
    ('Pasta', 'Pasta cocida', 'pasta.png', 'carbohidrato', 'gramos', 200),
    ('Yuca', 'Yuca cocida', NULL, 'carbohidrato', 'gramos', 100),
    ('Plátano frito', 'Plátano maduro frito', NULL, 'carbohidrato', 'gramos', 50),
    ('Tostones', 'Plátano verde frito', NULL, 'carbohidrato', 'gramos', 60),
    ('Maíz', 'Maíz cocido', NULL, 'carbohidrato', 'gramos', 80),
    ('Pan tradicional', 'Pan tradicional', NULL, 'carbohidrato', 'unidad', 1),
    
    -- Vegetales adicionales
    ('Caraotas negras', 'Frijoles negros cocidos', NULL, 'vegetal', 'gramos', 100),
    ('Auyama', 'Calabaza cocida', NULL, 'vegetal', 'gramos', 80),
    ('Lechuga extra', 'Lechuga fresca', NULL, 'vegetal', 'gramos', 50),
    ('Cebolla', 'Cebolla', NULL, 'vegetal', 'gramos', 30),
    ('Cilantro', 'Cilantro fresco', NULL, 'vegetal', 'gramos', 10),
    ('Perejil', 'Perejil fresco', NULL, 'vegetal', 'gramos', 10),
    ('Espinaca', 'Espinaca', NULL, 'vegetal', 'gramos', 80),
    ('Champiñones', 'Champiñones', NULL, 'vegetal', 'gramos', 80),
    
    -- Salsas y aderezos
    ('Mayonesa', 'Mayonesa', NULL, 'salsa', 'gramos', 20),
    ('Salsa de tomate', 'Salsa de tomate cocida', NULL, 'salsa', 'gramos', 30),
    ('Salsa bechamel', 'Salsa bechamel', NULL, 'salsa', 'gramos', 50),
    ('Salsa pesto', 'Salsa de albahaca', NULL, 'salsa', 'gramos', 40),
    ('Salsa alfredo', 'Salsa cremosa alfredo', NULL, 'salsa', 'gramos', 80),
    ('Salsa carbonara', 'Salsa carbonara con huevo', NULL, 'salsa', 'gramos', 80),
    ('Salsa boloñesa', 'Salsa de carne molida', NULL, 'salsa', 'gramos', 100),
    ('Salsa de champiñones', 'Salsa cremosa de champiñones', NULL, 'salsa', 'gramos', 80),
    ('Salsa verde', 'Salsa verde de perejil', NULL, 'salsa', 'gramos', 40),
    
    -- Carnes preparadas
    ('Carne de res', 'Carne de res en trozos', NULL, 'proteina', 'gramos', 150),
    ('Asado negro', 'Carne en salsa dulce oscura', NULL, 'proteina', 'gramos', 150),
    ('Parrilla mixta', 'Carnes variadas a la parrilla', NULL, 'proteina', 'gramos', 200),
    ('Morcilla', 'Morcilla', NULL, 'proteina', 'gramos', 80),
    ('Pollo a la brasa', 'Pollo marinado y asado', NULL, 'proteina', 'gramos', 200),
    ('Pollo al horno', 'Pollo horneado con especias', NULL, 'proteina', 'gramos', 180),
    ('Cordon bleu', 'Pechuga rellena de jamón y queso', NULL, 'proteina', 'gramos', 200),
    
    -- Pescados
    ('Merluza', 'Filete de merluza', NULL, 'proteina', 'gramos', 150),
    ('Trucha', 'Trucha entera o filete', NULL, 'proteina', 'gramos', 180),
    ('Pargo', 'Pargo entero', NULL, 'proteina', 'gramos', 200),
    ('Mero', 'Filete de mero', NULL, 'proteina', 'gramos', 150),
    ('Camarones', 'Camarones', NULL, 'proteina', 'gramos', 120),
    ('Mejillones', 'Mejillones', NULL, 'proteina', 'gramos', 100),
    ('Calamares', 'Calamares', NULL, 'proteina', 'gramos', 120),
    
    -- Otros
    ('Ensalada mixta', 'Ensalada de vegetales', NULL, 'vegetal', 'gramos', 100),
    ('Crutones', 'Pan tostado en cubos', NULL, 'carbohidrato', 'gramos', 20),
    ('Queso parmesano', 'Queso parmesano rallado', NULL, 'proteina', 'gramos', 20),
    ('Panceta', 'Tocino o panceta', NULL, 'proteina', 'gramos', 30),
    ('Piñones', 'Piñones', NULL, 'fruta', 'gramos', 20),
    ('Limón', 'Limón', NULL, 'fruta', 'unidad', 1),
    ('Aceite de oliva', 'Aceite de oliva', NULL, 'salsa', 'gramos', 10),
    ('Ajo', 'Ajo', NULL, 'vegetal', 'gramos', 5),
    ('Crema', 'Crema de leche', NULL, 'salsa', 'gramos', 30),
    ('Mantequilla', 'Mantequilla', NULL, 'salsa', 'gramos', 20)
ON CONFLICT DO NOTHING;

-- ===================================
-- PLATOS DEL DESAYUNO
-- ===================================
INSERT INTO Plato (nombre, descripcion) VALUES
    ('Arepa con queso blanco', 'Arepa rellena de queso blanco'),
    ('Arepa con queso amarillo', 'Arepa rellena de queso amarillo'),
    ('Arepa con jamón', 'Arepa rellena de jamón'),
    ('Arepa con perico', 'Arepa rellena de huevos revueltos'),
    ('Arepa con carne mechada', 'Arepa rellena de carne mechada'),
    ('Arepa con pernil', 'Arepa rellena de pernil'),
    ('Arepa mixta', 'Arepa con múltiples rellenos'),
    
    ('Empanada de carne mechada', 'Empanada frita rellena de carne mechada'),
    ('Empanada de carne molida', 'Empanada frita rellena de carne molida'),
    ('Empanada de pollo', 'Empanada frita rellena de pollo'),
    ('Empanada de queso', 'Empanada frita rellena de queso'),
    ('Empanada de cazón', 'Empanada frita rellena de cazón'),
    ('Empanada de pabellón', 'Empanada con carne, caraotas y plátano'),
    ('Empanada de chorizo', 'Empanada frita rellena de chorizo'),
    ('Empanada de atún', 'Empanada frita rellena de atún'),
    
    ('Cachapa con queso de mano', 'Cachapa con queso de mano'),
    ('Cachapa con jamón y queso blanco', 'Cachapa con jamón y queso blanco'),
    ('Cachapa con pernil', 'Cachapa con pernil'),
    
    ('Sandwich de jamón y queso', 'Sandwich de jamón y queso amarillo'),
    ('Sandwich de pernil', 'Sandwich de pernil'),
    ('Sandwich de pollo', 'Sandwich de pollo'),
    ('Sandwich de atún', 'Sandwich de atún con vegetales'),
    
    ('Pastelito de carne', 'Pastelito frito relleno de carne'),
    ('Pastelito de pollo', 'Pastelito frito relleno de pollo'),
    ('Pastelito de queso', 'Pastelito frito relleno de queso'),
    
    ('Cachito de jamón', 'Croissant relleno de jamón'),
    ('Cachito de jamón y queso', 'Croissant relleno de jamón y queso'),
    ('Cachito de pavo y queso crema', 'Croissant relleno de pavo y queso crema')
ON CONFLICT DO NOTHING;

-- ===================================
-- PLATOS DEL ALMUERZO
-- ===================================
INSERT INTO Plato (nombre, descripcion) VALUES
    -- Sopas
    ('Sopa de res', 'Sopa con carne de res y vegetales'),
    ('Sancocho', 'Caldo sustancioso con carne, yuca, plátano y maíz'),
    ('Crema de auyama', 'Crema suave de calabaza'),
    
    -- Carnes
    ('Pabellón criollo', 'Carne mechada con arroz, caraotas y plátano'),
    ('Asado negro', 'Carne en salsa dulce con arroz y plátano'),
    ('Parrilla mixta', 'Carnes variadas a la parrilla con guarniciones'),
    
    -- Aves
    ('Pollo a la brasa', 'Pollo marinado y asado con ensalada y papas'),
    ('Pollo al horno', 'Pollo horneado con arroz y vegetales'),
    ('Pollo en salsa de champiñones', 'Pechuga en salsa cremosa con puré'),
    ('Cordon bleu de pollo', 'Pechuga rellena empanizada con guarnición'),
    
    -- Pescados
    ('Filete de merluza a la plancha', 'Merluza con limón, arroz y ensalada'),
    ('Trucha al ajillo', 'Trucha con ajo y papas al vapor'),
    ('Pargo frito', 'Pargo entero frito con tostones y ensalada'),
    ('Mero en salsa verde', 'Mero en salsa de perejil con arroz'),
    
    -- Ensaladas
    ('Ensalada César con pollo', 'Lechuga romana, pollo, crutones y aderezo'),
    ('Ensalada de aguacate y tomate', 'Aguacate, tomate, cebolla y cilantro'),
    
    -- Pastas
    ('Pasta al pesto', 'Pasta con salsa de albahaca'),
    ('Pasta alfredo', 'Pasta en salsa cremosa'),
    ('Pasta a la carbonara', 'Pasta con huevo, queso y panceta'),
    ('Lasagna', 'Capas de pasta con carne y bechamel'),
    ('Pasta con mariscos', 'Pasta con camarones, mejillones y calamares'),
    ('Pasta boloñesa', 'Pasta con salsa de carne molida'),
    ('Raviolis', 'Pasta rellena con salsa'),
    ('Fettuccine con champiñones', 'Fettuccine en salsa cremosa de champiñones')
ON CONFLICT DO NOTHING;

-- ===================================
-- RELACIONES MENU-PLATO
-- ===================================

-- Desayuno (PK_menu = 1)
INSERT INTO Menu_plato (FK_menu, FK_plato) 
SELECT 1, PK_plato FROM Plato WHERE nombre LIKE 'Arepa%'
    OR nombre LIKE 'Empanada%'
    OR nombre LIKE 'Cachapa%'
    OR nombre LIKE 'Sandwich%'
    OR nombre LIKE 'Pastelito%'
    OR nombre LIKE 'Cachito%'
ON CONFLICT DO NOTHING;

-- Almuerzo (PK_menu = 2)
INSERT INTO Menu_plato (FK_menu, FK_plato)
SELECT 2, PK_plato FROM Plato WHERE nombre IN (
    'Sopa de res', 'Sancocho', 'Crema de auyama',
    'Pabellón criollo', 'Asado negro', 'Parrilla mixta',
    'Pollo a la brasa', 'Pollo al horno', 'Pollo en salsa de champiñones', 'Cordon bleu de pollo',
    'Filete de merluza a la plancha', 'Trucha al ajillo', 'Pargo frito', 'Mero en salsa verde',
    'Ensalada César con pollo', 'Ensalada de aguacate y tomate',
    'Pasta al pesto', 'Pasta alfredo', 'Pasta a la carbonara', 'Lasagna',
    'Pasta con mariscos', 'Pasta boloñesa', 'Raviolis', 'Fettuccine con champiñones'
)
ON CONFLICT DO NOTHING;

-- Cena (PK_menu = 3) - Incluye platos de desayuno y almuerzo
INSERT INTO Menu_plato (FK_menu, FK_plato)
SELECT 3, PK_plato FROM Plato
ON CONFLICT DO NOTHING;

-- ===================================
-- RELACIONES MENU-BEBIDA (todas las bebidas para todos los menús)
-- ===================================
INSERT INTO Menu_bebida (FK_menu, FK_bebida)
SELECT m.PK_menu, b.PK_bebida 
FROM Menu m CROSS JOIN Bebida b
ON CONFLICT DO NOTHING;

-- ===================================
-- PORCIONES (relación Plato-Componentes)
-- ===================================

-- Ejemplos de componentes para algunos platos principales

-- Pabellón Criollo
INSERT INTO Porcion (FK_plato, FK_alimento, cantidad) VALUES
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pabellón criollo'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Carne mechada'), 80),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pabellón criollo'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Arroz blanco'), 150),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pabellón criollo'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Caraotas negras'), 100),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pabellón criollo'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Plátano frito'), 50)
ON CONFLICT DO NOTHING;

-- Pollo a la brasa
INSERT INTO Porcion (FK_plato, FK_alimento, cantidad) VALUES
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pollo a la brasa'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Pollo a la brasa'), 200),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pollo a la brasa'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Papa'), 100),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pollo a la brasa'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Ensalada mixta'), 80)
ON CONFLICT DO NOTHING;

-- Pasta Boloñesa
INSERT INTO Porcion (FK_plato, FK_alimento, cantidad) VALUES
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pasta boloñesa'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Pasta'), 200),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pasta boloñesa'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Salsa boloñesa'), 150),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Pasta boloñesa'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Queso parmesano'), 20)
ON CONFLICT DO NOTHING;

-- Arepa con queso
INSERT INTO Porcion (FK_plato, FK_alimento, cantidad) VALUES
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Arepa con queso blanco'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Arepa'), 100),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Arepa con queso blanco'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Queso blanco'), 50)
ON CONFLICT DO NOTHING;

-- Empanada de carne mechada
INSERT INTO Porcion (FK_plato, FK_alimento, cantidad) VALUES
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Empanada de carne mechada'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Empanada (masa)'), 80),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Empanada de carne mechada'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Carne mechada'), 60)
ON CONFLICT DO NOTHING;

-- Sancocho
INSERT INTO Porcion (FK_plato, FK_alimento, cantidad) VALUES
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Sancocho'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Carne de res'), 100),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Sancocho'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Yuca'), 80),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Sancocho'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Plátano frito'), 60),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Sancocho'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Maíz'), 50),
    ((SELECT PK_plato FROM Plato WHERE nombre = 'Sancocho'), (SELECT PK_alimento FROM Componentes WHERE nombre = 'Zanahoria'), 40)
ON CONFLICT DO NOTHING;

