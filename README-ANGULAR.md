# 📋 Guía de Integración Angular - Sirve la Mesa

## 🚀 Inicio Rápido

### 1. Instalar dependencias del proyecto completo
```bash
# En la raíz del proyecto
npm install
```

Esto instalará las dependencias del backend Y de Angular automáticamente.


### 3. Desarrollo

Necesitas dos terminales:

**Terminal 1 - Backend (Puerto 3000):**
```bash
npm run dev
```

**Terminal 2 - Angular (Puerto 4200):**
```bash
npm run dev:angular
```

Accede a la aplicación en: http://localhost:4200

### 4. Build para Producción

```bash
# Construir Angular
npm run build:angular

# Configurar entorno
$env:NODE_ENV="production"  # PowerShell
# o
export NODE_ENV=production  # Linux/Mac

# Iniciar servidor
npm start
```

## 🏗️ Estructura del Proyecto

```
SirveLaMesa/
├── angular-app/           # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── login/
│   │   │   │   ├── game/
│   │   │   │   ├── drag-drop/
│   │   │   │   ├── personajes/
│   │   │   │   └── ingredientes/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── guards/
│   │   └── assets/
│   └── dist/             # Build de producción
├── backend files...      # API y servidor Express
└── database/             # Scripts SQL
```

## 🔄 Flujo de la Aplicación

1. **Login** → Captura nombres, edad, sexo
2. **Crear Participante** → POST `/api/participantes`
3. **Iniciar Sesión** → POST `/api/sesiones`
4. **Juego** → 3 escenarios (desayuno, almuerzo, cena)
   - Drag & drop de ingredientes
   - 8 personajes por escenario
   - Registro de tiempo y orden
5. **Guardar Decisiones** → POST `/api/decisiones/batch`
6. **Finalizar** → PUT `/api/sesiones/:id`

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Backend + Angular en paralelo (requiere 2 terminales)
npm run dev          # Terminal 1
npm run dev:angular  # Terminal 2
```

### Producción
```bash
# Build completo
npm run build:angular

# Servir en producción
NODE_ENV=production npm start
```

### Limpiar y reconstruir
```bash
# Windows
Remove-Item -Recurse angular-app/node_modules, angular-app/dist
cd angular-app && npm install && npm run build:prod

# Linux/Mac
rm -rf angular-app/node_modules angular-app/dist
cd angular-app && npm install && npm run build:prod
```

## 📝 Notas Importantes

1. **CORS**: En desarrollo, Angular proxy maneja CORS. En producción, todo se sirve desde el mismo dominio.

2. **Assets**: Las fuentes e imágenes DEBEN copiarse manualmente ya que son archivos binarios.

3. **Base de datos**: Asegúrate de que PostgreSQL esté corriendo y las tablas estén creadas.

4. **Variables de entorno**: Usa `config.example.env` como plantilla para crear tu `.env`.

## 🐛 Solución de Problemas

### "Cannot find module '@angular/...'"
```bash
cd angular-app
npm install
```

### "CORS error"
- Verifica que el backend esté corriendo en puerto 3000
- En desarrollo, usa http://localhost:4200 (no 127.0.0.1)

### "Fuentes no cargan"
- Verifica que copiaste los archivos .ttf y .otf
- Revisa las rutas en `angular-app/src/styles.scss`

### "Build falla"
```bash
# Limpiar cache de Angular
cd angular-app
Remove-Item -Recurse .angular, dist  # PowerShell
npm run build:prod
```
