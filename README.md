# 🍽️ Sirve la Mesa

**Sistema de investigación psicológica sobre porcionamiento de alimentos**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![Angular](https://img.shields.io/badge/Angular-17+-red.svg)](https://angular.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Descripción

**Sirve la Mesa** es una plataforma de investigación que simula situaciones de alimentación para estudiar patrones de porcionamiento de alimentos según variables sociodemográficas. El sistema permite a los participantes servir comida a personajes sintéticos con diferentes características (edad, género), registrando todas sus decisiones para análisis posterior.

### 🎯 Objetivo

Observar si existen diferencias en el porcionamiento de alimentos según el género, edad y otras características de los comensales (personajes sintéticos).

---

## ✨ Características Principales

### 🎮 Juego Interactivo (Angular)
- Interfaz moderna y responsiva desarrollada en Angular
- Sistema de drag & drop para servir alimentos
- 3 escenarios: Desayuno, Almuerzo y Cena
- 8 personajes sintéticos con diferentes perfiles
- Registro automático de tiempos de decisión

### 🗄️ Backend Robusto (Node.js + Express)
- API RESTful completa
- Base de datos PostgreSQL con estructura optimizada
- Sistema de sesiones y participantes
- Registro detallado de decisiones de porcionamiento
- WebSocket para comunicación en tiempo real

### 📊 Panel Administrativo
- Estadísticas en vivo de participantes y sesiones
- Análisis por género y rango de edad
- **Exportación de datos a CSV/Excel y JSON**
- Visualización de métricas clave
- Estado del sistema en tiempo real

### 📥 Exportación de Datos
- **CSV compatible con Excel** (UTF-8 con BOM)
- **JSON estructurado** para análisis programático
- Datos organizados por categoría de alimento:
  - Proteínas
  - Carbohidratos
  - Vegetales
  - Frutas
  - Salsas/Aderezos
- Información completa de participantes y sesiones

### 🔬 Sistema de Investigación
- Registro de datos sociodemográficos
- Soporte para instrumento EAT-26
- Datos antropométricos obligatorios (peso y estatura)
- Timestamps precisos de cada decisión
- Orden de servicio y tiempos de decisión

---

## 🛠️ Tecnologías

### Backend
- **Node.js** (v18+) - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos relacional
- **Socket.IO** - Comunicación en tiempo real
- **dotenv** - Gestión de variables de entorno

### Frontend
- **Angular** (v17+) - Framework de aplicación web
- **TypeScript** - Lenguaje tipado
- **RxJS** - Programación reactiva
- **Angular CDK** - Drag & Drop

### Base de Datos
- **PostgreSQL** (v12+)
- Índices optimizados
- Triggers automáticos
- Soporte JSONB para datos flexibles

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** v18 o superior
- **PostgreSQL** v12 o superior
- **npm** o **yarn**

### 1. Clonar el Repositorio

```powershell
git clone https://github.com/tu-usuario/Sirve-lamesa.git
cd Sirve-lamesa
```

### 2. Instalar Dependencias

```powershell
# Instala dependencias del backend Y del frontend (Angular)
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos (local o Supabase — ver abajo)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/sirve_la_mesa

# Servidor
PORT=3000
NODE_ENV=development

# Cliente (opcional)
CLIENT_URL=http://localhost:4200
```

#### Base de datos en Supabase (recomendado para desplegar online)

El backend solo usa **PostgreSQL** (cliente `pg`). Supabase te da una instancia Postgres en la nube; no hace falta el SDK de Supabase en este proyecto.

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. En el proyecto abre **Connect** (o **Settings → Database**) y copia una **Connection string** en formato **URI**.
3. **En Windows o si aparece `getaddrinfo ENOENT` con `db.xxx.supabase.co`:** la conexión **directa** suele usar **IPv6**. Muchas redes no la tienen bien; en ese caso usa la cadena **Session pooler** (puerto **5432**, host `aws-0-REGION.pooler.supabase.com`, usuario `postgres.TU_PROJECT_REF`). [Documentación de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres) lo explica como alternativa **IPv4**.
4. Sustituye `[YOUR-PASSWORD]` y pega en `.env` como `DATABASE_URL=...` (si la URL contiene `supabase`, el servidor activa SSL).
5. No necesitas crear una base llamada `sirve_la_mesa`: en Supabase la base por defecto suele llamarse **`postgres`**; el `DATABASE_URL` del panel ya apunta ahí.
6. **Una sola vez**, con ese `.env`, ejecuta en tu máquina `npm run init-db` para crear tablas y datos iniciales (⚠️ borra tablas previas del esquema si existían).
7. En tu hosting (Railway, Render, VPS, etc.), define las mismas variables de entorno (`DATABASE_URL`, `PORT`, `NODE_ENV=production`, `CLIENT_URL` con la URL pública de tu front si aplica).

### 4. Crear la Base de Datos (solo PostgreSQL local)

Si usas Postgres en tu PC y no Supabase:

```powershell
# Conectar a PostgreSQL y crear la base de datos
psql -U postgres
CREATE DATABASE sirve_la_mesa;
\q
```

### 5. Inicializar la Base de Datos

**⚠️ IMPORTANTE:** Este comando solo se ejecuta UNA VEZ (la primera vez o cuando necesites resetear):

```powershell
npm run init-db
```

Este comando:
- Crea todas las tablas necesarias
- Inserta datos iniciales (personajes, ingredientes, menús)
- Configura relaciones e índices

---

## 🎮 Uso del Sistema

### Modo Desarrollo

Necesitas **dos terminales**:

**Terminal 1 - Backend (Puerto 3000):**
```powershell
npm run dev
```

**Terminal 2 - Angular (Puerto 4200):**
```powershell
npm run dev:angular
```

Las peticiones a `/api` se reenvían al backend usando el mismo **`PORT`** definido en el `.env` de la raíz (`angular-app/src/proxy.conf.js`). Debes tener **las dos terminales** en marcha a la vez; si solo corre Angular, verás `ECONNREFUSED` en consola.

Luego accede a:
- **Juego:** http://localhost:4200
- **Panel Admin:** http://localhost:3000/admin
- **API:** http://localhost:3000/api

### Modo Producción

```powershell
# 1. Construir Angular
npm run build:angular

# 2. Configurar entorno
$env:NODE_ENV="production"

# 3. Iniciar servidor
npm start
```

Accede a: http://localhost:3000

---

## 📚 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor en modo producción |
| `npm run dev` | Inicia el servidor en modo desarrollo (con nodemon) |
| `npm run dev:angular` | Inicia Angular en modo desarrollo (puerto 4200) |
| `npm run build:angular` | Construye Angular para producción |
| `npm run init-db` | **Inicializa/resetea la base de datos** (⚠️ elimina datos) |

---

## 📊 Estructura del Proyecto

```
Sirve-lamesa/
├── angular-app/              # Aplicación Angular (frontend)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Componentes del juego
│   │   │   ├── services/     # Servicios de API
│   │   │   ├── models/       # Modelos de datos
│   │   │   └── guards/       # Guards de autenticación
│   │   └── assets/           # Imágenes de ingredientes
│   └── dist/                 # Build de producción
│
├── controllers/              # Lógica de negocio
│   └── gameDataController.js # Controlador principal
│
├── routes/                   # Rutas de la API
│   ├── participantes.js
│   ├── sesiones.js
│   ├── decisiones.js
│   ├── personajes.js
│   ├── ingredientes.js
│   └── menu.js
│
├── database/                 # Scripts SQL
│   ├── schema.sql           # Estructura de tablas
│   ├── participantes.sql
│   ├── sesiones_juego.sql
│   ├── decisiones_porcionamiento.sql
│   └── seed_data.sql        # Datos iniciales
│
├── public/                   # Archivos estáticos
│   ├── admin.html           # Panel administrativo
│   └── index.html           # Página de inicio
│
├── server.js                 # Servidor principal
├── init-database.js          # Script de inicialización de BD
├── package.json
└── .env                      # Variables de entorno (no versionado)
```

---

## 🔌 API Endpoints

### Participantes
- `POST /api/participantes` - Crear participante
- `GET /api/participantes/:id` - Obtener participante

### Sesiones
- `POST /api/sesiones` - Iniciar sesión de juego
- `PUT /api/sesiones/:id` - Finalizar sesión
- `GET /api/sesiones/:id` - Obtener sesión
- `GET /api/sesiones/:id/decisiones` - Obtener decisiones de sesión

### Decisiones
- `POST /api/decisiones` - Registrar decisión
- `POST /api/decisiones/batch` - Registrar múltiples decisiones

### Datos del Juego
- `GET /api/personajes` - Obtener personajes sintéticos
- `GET /api/ingredientes` - Obtener ingredientes
- `GET /api/menu` - Obtener menús

### Estadísticas
- `GET /api/estadisticas/generales` - Estadísticas generales
- `GET /api/estadisticas/por-genero` - Análisis por género
- `GET /api/estadisticas/por-edad` - Análisis por edad

### Exportación
- `GET /api/exportar/csv` - **Descargar datos en CSV**
- `GET /api/exportar/json` - **Descargar datos en JSON**

### Sistema
- `GET /api/health` - Estado del servidor
- `GET /api/test-connection` - Probar conexión a BD

---

## 📥 Exportación de Datos

### Acceso al Panel de Exportación

1. Inicia el servidor: `npm run dev`
2. Ve a: http://localhost:3000/admin
3. Busca la sección **"📥 Exportar Datos de Sesiones"**
4. Haz clic en **"📥 Descargar CSV (Excel)"** o **"📋 Descargar JSON"**

### Formato de Datos Exportados

El archivo CSV/JSON incluye:

#### Información del Participante
- ID anónimo, Edad, Sexo
- Datos antropométricos (peso, altura, IMC)
- Datos geográficos y socioeconómicos
- Puntuación EAT-26 (si aplica)

#### Información de la Sesión
- ID de sesión, fechas de inicio/fin
- Duración total en segundos
- Estado de la sesión

#### Información de Decisiones
- Escenario (desayuno/almuerzo/cena)
- Tipo de personaje servido (sujeto)
- Edad y sexo del personaje
- Orden de servicio
- Tiempo de decisión en milisegundos
- Cantidad total servida en gramos

#### **Porciones Organizadas por Categoría**
- **Proteínas:** Ej. "Pollo Frito (150g), Tocineta (30g)"
- **Carbohidratos:** Ej. "Papa (100g), Pan Tostado (2rebanadas)"
- **Vegetales:** Ej. "Tomate (100g), Zanahoria (80g)"
- **Frutas:** Ej. "Manzana (1unidad), Fresa (100g)"
- **Salsas/Aderezos:** Ej. "Mayonesa (20g)"

---

## 🗄️ Base de Datos

### Esquema Principal

```
Participantes
├── Sesiones_juego
│   └── Decisiones_porcionamiento
│
Menu
├── Menu_plato → Plato
│   └── Porcion → Componentes
└── Menu_bebida → Bebida

Personajes (personajes sintéticos)
Componentes (ingredientes)
```

### Características de la BD

- **Relaciones bien definidas** con claves foráneas
- **Índices optimizados** para consultas rápidas
- **Triggers automáticos** para calcular duraciones
- **JSONB** para almacenar componentes servidos
- **Índices GIN** para búsquedas en JSONB

### Persistencia de Datos

⚠️ **IMPORTANTE:** El servidor ya NO resetea la base de datos al iniciar.

- ✅ Los datos persisten entre reinicios del servidor
- ✅ Solo se resetean con `npm run init-db`
- ✅ Exporta tus datos antes de ejecutar `npm run init-db`

---

## 🎯 Flujo del Juego

1. **Login del Participante**
   - Captura: edad, sexo, peso y estatura
   - Datos opcionales: EAT-26 y datos complementarios

2. **Inicio de Sesión**
   - Se crea una sesión en la BD
   - Se registran metadatos del dispositivo

3. **Juego - 3 Escenarios**
   - Se asigna un escenario aleatorio (desayuno/almuerzo/cena)
   - Se presentan 8 personajes sintéticos
   - El participante sirve comida mediante drag & drop

4. **Registro de Decisiones**
   - Cada plato servido se guarda con:
     - Componentes y cantidades
     - Tiempo de decisión
     - Orden de servicio
     - Características del personaje servido

5. **Finalización**
   - Se marca la sesión como completada
   - Se calcula la duración total

6. **Análisis**
   - Los investigadores acceden al panel admin
   - Exportan datos para análisis estadístico

---

## 🔧 Solución de Problemas

### Error: "Cannot connect to database"

```powershell
# Verificar que PostgreSQL esté corriendo
pg_isready

# Verificar credenciales en .env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/sirve_la_mesa
```

### Error: "Port 3000 already in use"

```powershell
# Cambiar el puerto en .env
PORT=3001
```

### Error: "Angular not found"

```powershell
# Reinstalar dependencias de Angular
cd angular-app
npm install
cd ..
```

### Los datos se borran al reiniciar

✅ **Solución:** Esto ya NO debería pasar. El servidor ya no ejecuta `init-db` automáticamente.

Si aún se borran, verifica que no tengas `await initDatabase()` sin comentar en `server.js`.

---

## 📖 Documentación Adicional

- **[README-ANGULAR.md](README-ANGULAR.md)** - Guía detallada de Angular
- **[INICIALIZACION-BD.md](INICIALIZACION-BD.md)** - Guía de base de datos
- **[CONFIGURACION.md](CONFIGURACION.md)** - Configuración avanzada

---

## 🤝 Contribuir

Este es un proyecto de investigación académica. Si deseas contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Equipo

**Equipo Sirve la Mesa**  
Proyecto de investigación en psicología de la alimentación

---

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación en `/docs`
2. Verifica los issues existentes en GitHub
3. Crea un nuevo issue con detalles del problema

---

## 🎓 Citas y Referencias

Si utilizas este sistema en tu investigación, por favor cita:

```
Sirve la Mesa - Sistema de investigación sobre porcionamiento de alimentos
Equipo Sirve la Mesa (2025)
https://github.com/tu-usuario/Sirve-lamesa
```

---

## 🔄 Changelog

### v1.0.0 (2025-02-08)
- ✅ Sistema completo de juego en Angular
- ✅ Backend con API RESTful
- ✅ Panel administrativo con estadísticas
- ✅ **Exportación de datos a CSV/JSON**
- ✅ Base de datos PostgreSQL optimizada
- ✅ Sistema de persistencia de datos
- ✅ Documentación completa



**¡Gracias por usar Sirve la Mesa!** 🍽️✨
