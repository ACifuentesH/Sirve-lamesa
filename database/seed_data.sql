-- Datos iniciales del menú basados en el anexo del proyecto
-- Menú del restaurante El Solar del Este, Las Mercedes

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
INSERT INTO Componentes (nombre, descripcion) VALUES
    -- Proteínas
    ('Queso blanco', 'Queso blanco fresco'),
    ('Queso amarillo', 'Queso amarillo tipo cheddar'),
    ('Queso guayanés', 'Queso guayanés artesanal'),
    ('Queso de mano', 'Queso de mano venezolano'),
    ('Queso telita', 'Queso telita suave'),
    ('Jamón', 'Jamón de pierna'),
    ('Perico', 'Huevos revueltos con tomate y cebolla'),
    ('Carne mechada', 'Carne de res desmechada'),
    ('Pernil', 'Pernil de cerdo'),
    ('Carne molida', 'Carne molida de res'),
    ('Salchicha', 'Salchicha tipo viena'),
    ('Pollo desmechado', 'Pollo desmenuzado'),
    ('Chorizo', 'Chorizo español'),
    ('Atún', 'Atún enlatado'),
    ('Cazón', 'Pescado cazón'),
    ('Pavo', 'Pavo en lonchas'),
    ('Queso crema', 'Queso crema untable'),
    
    -- Carbohidratos
    ('Arepa', 'Arepa de maíz'),
    ('Empanada (masa)', 'Masa de empanada frita'),
    ('Cachapa', 'Cachapa de maíz'),
    ('Pan de sandwich', 'Pan de molde para sandwich'),
    ('Pastelito (masa)', 'Masa de pastelito frita'),
    ('Cachito (masa)', 'Croissant venezolano'),
    ('Arroz blanco', 'Arroz blanco cocido'),
    ('Pasta', 'Pasta cocida'),
    ('Papa', 'Papa cocida o frita'),
    ('Yuca', 'Yuca cocida'),
    ('Plátano frito', 'Plátano maduro frito'),
    ('Tostones', 'Plátano verde frito'),
    ('Maíz', 'Maíz cocido'),
    ('Pan', 'Pan tradicional'),
    
    -- Legumbres y vegetales
    ('Caraotas negras', 'Frijoles negros cocidos'),
    ('Zanahoria', 'Zanahoria cocida'),
    ('Auyama', 'Calabaza cocida'),
    ('Lechuga', 'Lechuga fresca'),
    ('Tomate', 'Tomate fresco'),
    ('Cebolla', 'Cebolla'),
    ('Aguacate', 'Aguacate fresco'),
    ('Cilantro', 'Cilantro fresco'),
    ('Perejil', 'Perejil fresco'),
    ('Espinaca', 'Espinaca'),
    ('Champiñones', 'Champiñones'),
    
    -- Salsas y aderezos
    ('Mayonesa', 'Mayonesa'),
    ('Salsa de tomate', 'Salsa de tomate cocida'),
    ('Salsa bechamel', 'Salsa bechamel'),
    ('Salsa pesto', 'Salsa de albahaca'),
    ('Salsa alfredo', 'Salsa cremosa alfredo'),
    ('Salsa carbonara', 'Salsa carbonara con huevo'),
    ('Salsa boloñesa', 'Salsa de carne molida'),
    ('Salsa de champiñones', 'Salsa cremosa de champiñones'),
    ('Salsa verde', 'Salsa verde de perejil'),
    
    -- Carnes preparadas
    ('Carne de res', 'Carne de res en trozos'),
    ('Asado negro', 'Carne en salsa dulce oscura'),
    ('Parrilla mixta', 'Carnes variadas a la parrilla'),
    ('Morcilla', 'Morcilla'),
    ('Pollo a la brasa', 'Pollo marinado y asado'),
    ('Pollo al horno', 'Pollo horneado con especias'),
    ('Cordon bleu', 'Pechuga rellena de jamón y queso'),
    
    -- Pescados
    ('Merluza', 'Filete de merluza'),
    ('Trucha', 'Trucha entera o filete'),
    ('Pargo', 'Pargo entero'),
    ('Mero', 'Filete de mero'),
    ('Camarones', 'Camarones'),
    ('Mejillones', 'Mejillones'),
    ('Calamares', 'Calamares'),
    
    -- Otros
    ('Ensalada mixta', 'Ensalada de vegetales'),
    ('Crutones', 'Pan tostado en cubos'),
    ('Queso parmesano', 'Queso parmesano rallado'),
    ('Panceta', 'Tocino o panceta'),
    ('Piñones', 'Piñones'),
    ('Limón', 'Limón'),
    ('Aceite de oliva', 'Aceite de oliva'),
    ('Ajo', 'Ajo'),
    ('Crema', 'Crema de leche'),
    ('Mantequilla', 'Mantequilla')
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

