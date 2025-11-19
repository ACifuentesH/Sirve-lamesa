# Sirve la Mesa - Aplicación Angular

## 🚀 Desarrollo

### Prerrequisitos
- Node.js >= 18
- Angular CLI (se instalará automáticamente)

### Instalación
```bash
cd angular-app
npm install
```

### Servidor de desarrollo
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`. El proxy está configurado para redirigir las peticiones API a `http://localhost:3000`.

**Importante**: Asegúrate de que el servidor backend esté corriendo en el puerto 3000.

## 🏗️ Build para Producción

### Windows (PowerShell)
```powershell
.\build.ps1
```

### Linux/Mac
```bash
chmod +x build.sh
./build.sh
```

### Manual
```bash
npm run build:prod
```

El build se generará en `dist/sirve-la-mesa/`.

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── login/          # Formulario de inicio
│   │   ├── game/           # Componente principal del juego
│   │   ├── drag-drop/      # Componentes drag & drop
│   │   ├── personajes/     # Tarjetas de personajes
│   │   └── ingredientes/   # Panel de ingredientes
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   └── game-data.service.ts
│   ├── models/
│   └── guards/
├── assets/
│   ├── fonts/              # Rocket Raccoon, Gildsley
│   └── images/
│       └── ingredientes/   # Imágenes de alimentos
└── environments/
```

## 🎨 Assets Requeridos

### Fuentes
Copiar desde `Sirve-lamesa/`:
- `Rocket Raccoon Free.ttf`
- `Gildsley DEMO.otf`

A la carpeta `src/assets/fonts/`.

### Imágenes
Copiar todos los archivos PNG desde `Sirve-lamesa/assets/` a `src/assets/images/ingredientes/`.

## 🔧 Configuración

### Desarrollo
El archivo `src/proxy.conf.json` redirige las peticiones `/api` al backend en `localhost:3000`.

### Producción
En producción, la aplicación se sirve desde Express y las rutas API están en el mismo dominio.

## 🐛 Solución de Problemas

### Error de CORS
- Verifica que el backend esté corriendo
- Confirma que el proxy esté configurado correctamente

### Fuentes no cargan
- Asegúrate de copiar los archivos TTF/OTF a `src/assets/fonts/`
- Verifica las rutas en `src/styles.scss`

### Imágenes no aparecen
- Copia todas las imágenes PNG a `src/assets/images/ingredientes/`
- Verifica los nombres de archivo en `ingredientes-data.json`
