# 🅰️ Guía de Integración Angular - Sirve la Mesa

> **Nota de vigencia (agosto 2026, issue #23 / A9):** este documento describe
> la integración original Angular ↔ Express ↔ PostgreSQL. La app ya no usa
> ese camino: `angular-app/` habla directo con Supabase desde el navegador y
> se despliega como build estático (Vercel), pensado para incrustarse en un
> `<iframe>` en el sitio de la Fundación. Para configuración de variables de
> entorno ver `CONFIGURACION.md`; para el despliegue y la incrustación en
> `<iframe>` ver `docs/INTEGRACION-IFRAME.md`. La sección "Build para
> Producción" de más abajo está corregida para reflejar esto; el resto del
> documento (componentes, flujo de datos vía Express) describe la
> arquitectura anterior y puede no coincidir con el estado actual del código.

## 📦 Instalación Completa

### Paso 1: Instalar todas las dependencias
```powershell
# Desde la raíz del proyecto
npm install
```

Esto instalará:
- Dependencias del backend (Express, PostgreSQL, etc.)
- Dependencias de Angular (automáticamente via postinstall)

### Paso 2: Copiar Assets

#### Fuentes
```powershell
Copy-Item "Sirve-lamesa\Rocket Raccoon Free.ttf" "angular-app\src\assets\fonts\"
Copy-Item "Sirve-lamesa\Gildsley DEMO.otf" "angular-app\src\assets\fonts\"
```

#### Imágenes de ingredientes
```powershell
Copy-Item "Sirve-lamesa\assets\*.png" "angular-app\src\assets\images\ingredientes\"
Copy-Item "Sirve-lamesa\assets\*.jpg" "angular-app\src\assets\images\ingredientes\"
```

### Paso 3: Configurar Base de Datos

```powershell
# Crear base de datos en PostgreSQL
psql -U postgres
CREATE DATABASE sirve_la_mesa;
\q
```

### Paso 4: Configurar Variables de Entorno

```powershell
Copy-Item config.example.env .env
```

Editar `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/sirve_la_mesa
```

## 🚀 Desarrollo

### Opción A: Dos Terminales (Recomendado)

**Terminal 1 - Backend:**
```powershell
npm run dev
```

**Terminal 2 - Angular:**
```powershell
npm run dev:angular
```

Accede a: http://localhost:4200

### Opción B: Solo Backend (sin Angular)

```powershell
npm start
```

## 🏗️ Build para Producción (vigente)

El camino real de despliegue **no** sirve el build desde Express. Es un build
estático de Angular con rutas relativas (`base href="./"`, ya configurado en
`angular-app/angular.json`), pensado para Vercel y para incrustarse en un
`<iframe>` en el sitio de la Fundación.

```powershell
cd angular-app
Copy-Item .env.example .env    # completar SUPABASE_URL / SUPABASE_ANON_KEY / URL_FUNDACION — ver CONFIGURACION.md
npm install
npm run build:prod             # o build:vercel, que además genera environment.prod.ts desde variables de entorno
```

El resultado queda en `angular-app/dist/sirve-la-mesa/`, servible como
archivos estáticos desde cualquier subdirectorio sin ajustes adicionales.
Detalle completo del despliegue y el snippet de `<iframe>` para la Fundación:
`docs/INTEGRACION-IFRAME.md`.

## 🧩 Componentes de la Aplicación

### Componente Login
- **Ubicación**: `angular-app/src/app/components/login/`
- **Función**: Captura edad, sexo, peso y estatura del participante (anónimo)
- **Diseño**: Mantiene el diseño circular con patrón de picnic
- **Validaciones**: Formularios reactivos con validación en tiempo real

### Componente Game
- **Ubicación**: `angular-app/src/app/components/game/`
- **Función**: Contenedor principal del juego
- **Layout**: Grid de 3 columnas (ingredientes | plato | personajes)
- **Flujo**: 3 escenarios x 8 personajes = 24 decisiones totales

### Componente Drag & Drop
- **Ubicación**: `angular-app/src/app/components/drag-drop/`
- **Componentes**:
  - `IngredienteComponent`: Elemento draggable
  - `PlatoDropZoneComponent`: Zona de drop con lista de ingredientes

### Otros Componentes
- **PersonajesComponent**: Lista de 8 personajes sintéticos
- **IngredientesComponent**: Panel filtrable de ingredientes

## 🎨 Personalización

### Colores del Proyecto
```scss
--color-verde: #25533F
--color-azul: #52A5CE
--color-azul-claro: #B8CEE8
--color-rosa: #FF7BAC
--color-naranja: #EF6F3C
```

### Fuentes
- **Rocket Raccoon**: Títulos principales
- **Gildsley**: Textos y labels

## 🔌 Integración con Backend

### API Service
El servicio `ApiService` provee métodos para:
- `crearParticipante(data)`
- `iniciarSesion(data)`
- `registrarDecision(data)`
- `registrarDecisionesBatch(decisiones[])`
- `finalizarSesion(id, data)`

### Auth Service
Maneja:
- Participante actual (localStorage)
- Sesión activa (localStorage)
- Guard para proteger rutas

### Game Data Service
Gestiona:
- Escenario actual (desayuno/almuerzo/cena)
- Personaje actual
- Decisiones temporales
- Ingredientes disponibles

## 🐛 Errores Comunes

### Error: "Cannot find module '@angular/...'"
```powershell
cd angular-app
npm install
```

### Error: "CORS policy"
- Verifica que backend esté en puerto 3000
- Usa http://localhost:4200 (no 127.0.0.1)

### Error: Fuentes no cargan
- Copia los archivos .ttf y .otf manualmente
- Verifica rutas en `src/styles.scss`

### Error: Imágenes no aparecen
- Copia todos los PNG de `Sirve-lamesa/assets/`
- Los nombres deben coincidir exactamente con `ingredientes-data.json`

## 📊 Flujo de Datos

```
Usuario → Login Component
    ↓
POST /api/participantes (edad, sexo, peso_kg, altura_cm)
    ↓
Recibe: { pk_participante: 1, ... }
    ↓
POST /api/sesiones ({ participante_id: 1 })
    ↓
Recibe: { pk_sesion: 1, ... }
    ↓
Navega a /juego (AuthGuard verifica sesión)
    ↓
Game Component carga ingredientes y personajes
    ↓
Por cada personaje (8 x 3 escenarios = 24):
  - Usuario arrastra ingredientes
  - Ajusta cantidades
  - Click "Servir"
  - Guarda decisión temporal
    ↓
Al finalizar los 3 escenarios:
    ↓
POST /api/decisiones/batch (todas las 24 decisiones)
    ↓
PUT /api/sesiones/:id ({ estado: 'completada' })
    ↓
Pantalla de agradecimiento → Redirige a Login
```

## 📝 Datos Registrados

Para cada decisión se registra:
- ID de sesión
- Escenario (desayuno/almuerzo/cena)
- Tipo de personaje
- Rango de edad del personaje
- Sexo del personaje
- Componentes servidos con cantidades en gramos
- Tiempo de decisión en milisegundos
- Orden de servicio (1-8 por escenario)

## ✅ Checklist de Integración

- [ ] Dependencias instaladas (`npm install`)
- [ ] Fuentes copiadas a `angular-app/src/assets/fonts/`
- [ ] Imágenes copiadas a `angular-app/src/assets/images/ingredientes/`
- [ ] PostgreSQL corriendo
- [ ] Base de datos `sirve_la_mesa` creada
- [ ] Archivo `.env` configurado
- [ ] Backend corriendo en puerto 3000
- [ ] Angular corriendo en puerto 4200
- [ ] Login funcional
- [ ] Juego navegable
- [ ] Datos guardándose en BD

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025
