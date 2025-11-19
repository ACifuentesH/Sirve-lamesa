# 🍽️ Sirve la Mesa

Sistema de investigación psicológica sobre porcionamiento de alimentos con integración de juego Godot y backend Node.js + PostgreSQL.

## 📋 Descripción

"Sirve la Mesa" es una plataforma diseñada para simular situaciones de alimentación y estudiar patrones de porcionamiento según variables sociodemográficas. El sistema permite observar si existen diferencias en la cantidad y distribución de alimentos servidos según el género, edad y otras características de los comensales sintéticos.

## 🎯 Objetivo

Simular una situación en la que un usuario (participante) sirva comida a otras personas (sujetos sintéticos), observando si existen diferencias de porcionamiento según variables sociodemográficas.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────┐
│   Juego Godot 4.4                   │
│   (shity ass prueba/)               │
│   - Interfaz de usuario             │
│   - Mecánica drag & drop            │
│   - Comunicación HTTP con backend   │
└─────────────┬───────────────────────┘
              │
              │ HTTP/REST API
              │
┌─────────────▼───────────────────────┐
│   Backend Express.js                │
│   - API REST                        │
│   - WebSocket (Socket.IO)           │
│   - Controladores de lógica         │
└─────────────┬───────────────────────┘
              │
              │ PostgreSQL
              │
┌─────────────▼───────────────────────┐
│   Base de Datos PostgreSQL          │
│   - Participantes                   │
│   - Sesiones de juego               │
│   - Decisiones de porcionamiento    │
│   - Menús, Platos, Componentes      │
└─────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18.x
- PostgreSQL >= 12
- Godot Engine 4.4 (para desarrollo del juego)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/SirveLaMesa.git
cd SirveLaMesa
```

2. **Instalar dependencias**
```powershell
npm install
```

3. **Configurar variables de entorno**

Copia el archivo de ejemplo y configura tus variables:
```powershell
Copy-Item config.example.env .env
```

Edita `.env` con tus configuraciones:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/sirve_la_mesa
CLIENT_URL=http://localhost:3000
```

4. **Crear base de datos PostgreSQL**
```powershell
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE sirve_la_mesa;

# Salir
\q
```

5. **Iniciar el servidor**
```powershell
npm start
```

El servidor iniciará en `http://localhost:3000` y automáticamente:
- Creará las tablas necesarias
- Cargará los datos iniciales del menú
- Estará listo para recibir peticiones

### Verificar la instalación

1. Abre tu navegador en `http://localhost:3000`
2. Haz clic en "Test API" para verificar la conexión
3. Accede al panel admin en `http://localhost:3000/admin`

## 📁 Estructura del Proyecto

```
SirveLaMesa/
├── database/                    # Scripts SQL
│   ├── schema.sql              # Tablas de menú
│   ├── participantes.sql       # Tabla de participantes
│   ├── sesiones_juego.sql      # Tabla de sesiones
│   ├── decisiones_porcionamiento.sql
│   └── seed_data.sql           # Datos iniciales del menú
│
├── controllers/                 # Lógica de negocio
│   └── gameDataController.js
│
├── routes/                      # Endpoints de la API
│   ├── participantes.js
│   ├── sesiones.js
│   ├── menu.js
│   └── decisiones.js
│
├── public/                      # Archivos públicos
│   ├── index.html              # Página principal
│   ├── admin.html              # Panel administrativo
│   └── game/                   # Juego exportado de Godot
│       └── index.html
│
├── docs/                        # Documentación
│   └── INTEGRACION_GODOT.md    # Guía de integración
│
├── shity ass prueba/            # Proyecto Godot
│   └── [archivos de Godot]
│
├── server.js                    # Servidor principal
├── package.json
└── README.md
```

## 🎮 Integración con Godot

### Exportar el juego

1. Abre el proyecto de Godot en `shity ass prueba/`
2. Ve a **Project → Export**
3. Selecciona **Web** o **Desktop**
4. Exporta a `public/game/`

### Usar las APIs desde Godot

Consulta la guía completa en [`docs/INTEGRACION_GODOT.md`](docs/INTEGRACION_GODOT.md)

Ejemplo básico:
```gdscript
# Crear un participante
var datos = {
    "edad": 25,
    "sexo": "F",
    "peso_kg": 65,
    "altura_cm": 165,
    "consentimiento_informado": true
}

api_client.post_request("/participantes", datos, callback)
```

## 🔌 API Endpoints

### Participantes
- `POST /api/participantes` - Crear nuevo participante
- `GET /api/participantes/:id` - Obtener participante

### Sesiones
- `POST /api/sesiones` - Iniciar sesión de juego
- `PUT /api/sesiones/:id` - Finalizar sesión
- `GET /api/sesiones/:id` - Obtener datos de sesión
- `GET /api/sesiones/:id/decisiones` - Obtener decisiones de una sesión

### Menú
- `GET /api/menu` - Obtener todos los menús
- `GET /api/menu/platos/:menu_id` - Obtener platos de un menú
- `GET /api/menu/componentes/:plato_id` - Obtener componentes de un plato
- `GET /api/menu/bebidas` - Obtener todas las bebidas

### Decisiones
- `POST /api/decisiones` - Registrar decisión de porcionamiento
- `POST /api/decisiones/batch` - Registrar múltiples decisiones

### Sistema
- `GET /api/health` - Estado del servidor
- `GET /api/test-connection` - Verificar conexión a BD

### Estadísticas
- `GET /api/estadisticas/generales` - Estadísticas generales
- `GET /api/estadisticas/por-genero` - Análisis por género
- `GET /api/estadisticas/por-edad` - Análisis por edad

## 📊 Base de Datos

### Tablas Principales

1. **Participantes**: Datos sociodemográficos
2. **Sesiones_juego**: Registro de cada sesión
3. **Decisiones_porcionamiento**: Cada decisión de servir comida
4. **Menu**: Menús disponibles (Desayuno, Almuerzo, Cena)
5. **Plato**: Platos del restaurante
6. **Componentes**: Ingredientes/alimentos
7. **Bebida**: Bebidas disponibles
8. **Porcion**: Relación Plato-Componentes

### Diagrama de Relaciones

Ver imagen del diagrama en la raíz del proyecto.

## 🛠️ Desarrollo

### Modo desarrollo
```powershell
npm run dev
```

### Variables de entorno

- `NODE_ENV`: development | production
- `PORT`: Puerto del servidor (default: 3000)
- `DATABASE_URL`: URL de conexión PostgreSQL
- `CLIENT_URL`: URL del cliente para CORS

## 📦 Deploy

### Render.com (Recomendado)

1. Conecta tu repositorio en Render
2. Configura las variables de entorno
3. Añade servicio PostgreSQL
4. Deploy automático desde Git

### Otras plataformas

El sistema es compatible con Heroku, Railway, DigitalOcean, etc.

## 🧪 Testing

Para probar los endpoints:

```powershell
# Test de salud
curl http://localhost:3000/api/health

# Test de conexión BD
curl http://localhost:3000/api/test-connection

# Crear participante
curl -X POST http://localhost:3000/api/participantes `
  -H "Content-Type: application/json" `
  -d '{"edad":25,"sexo":"F","consentimiento_informado":true}'
```

## 📝 Datos de Investigación

Los datos registrados incluyen:

- **Participante**: Edad, sexo, IMC, nivel socioeconómico, EAT-26
- **Sesión**: Tiempo de inicio/fin, duración total, dispositivo
- **Decisión**: Personaje servido, plato elegido, componentes con cantidades en gramos, tiempo de decisión, orden de servicio

## 🤝 Contribución

Este es un proyecto de investigación. Para contribuir:

1. Fork del repositorio
2. Crea tu rama (`git checkout -b feature/NuevaCaracteristica`)
3. Commit de cambios (`git commit -m 'Agregar característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

## 👥 Equipo

- Desarrollo Backend: [Tu nombre]
- Desarrollo Godot: [Compañero]
- Investigación: [Equipo de investigación]

## 📞 Contacto

Para preguntas sobre el proyecto:
- Email: [tu-email]
- Issues: GitHub Issues

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025
