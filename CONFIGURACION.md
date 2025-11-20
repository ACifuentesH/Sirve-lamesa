# 🔧 Guía de Configuración - Sirve la Mesa

## Paso 1: Configurar la Base de Datos en pgAdmin

Ya creaste la base de datos en pgAdmin. Ahora necesitas obtener la información de conexión:

1. **Abre pgAdmin** y conecta a tu servidor PostgreSQL
2. **Busca tu base de datos** (probablemente se llama `sirve_la_mesa` o similar)
3. **Clic derecho en la base de datos → Properties** para ver los detalles

### Información que necesitas:
- **Host**: Generalmente `localhost` o `127.0.0.1`
- **Puerto**: Generalmente `5432` (puerto por defecto de PostgreSQL)
- **Nombre de la base de datos**: El nombre que le diste (ej: `sirve_la_mesa`)
- **Usuario**: Generalmente `postgres` (o el usuario que configuraste)
- **Contraseña**: La contraseña que configuraste para PostgreSQL

## Paso 2: Crear el archivo .env

Crea un archivo llamado `.env` en la raíz del proyecto con el siguiente contenido:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_base_datos
CLIENT_URL=http://localhost:3000
```

### Ejemplo real:
Si tu configuración es:
- Usuario: `postgres`
- Contraseña: `mipassword123`
- Host: `localhost`
- Puerto: `5432`
- Base de datos: `sirve_la_mesa`

Tu `DATABASE_URL` sería:
```env
DATABASE_URL=postgresql://postgres:mipassword123@localhost:5432/sirve_la_mesa
```

## Paso 3: Instalar dependencias

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
npm install
```

## Paso 4: Iniciar el servidor

```powershell
npm start
```

El servidor:
- Se conectará a tu base de datos
- Creará automáticamente todas las tablas necesarias
- Cargará los datos iniciales del menú
- Estará disponible en `http://localhost:3000`

## Paso 5: Verificar que todo funciona

1. Abre tu navegador en `http://localhost:3000`
2. Ve a `http://localhost:3000/api/test-connection` para verificar la conexión a la BD
3. Ve a `http://localhost:3000/api/health` para verificar el estado del servidor

## Solución de problemas

### Error: "password authentication failed"
- Verifica que la contraseña en `.env` sea correcta
- Asegúrate de que el usuario tenga permisos en la base de datos

### Error: "database does not exist"
- Verifica que el nombre de la base de datos en `.env` coincida con el que creaste en pgAdmin
- Asegúrate de que la base de datos esté creada antes de iniciar el servidor

### Error: "connection refused"
- Verifica que PostgreSQL esté corriendo
- Verifica que el puerto sea correcto (generalmente 5432)
- Verifica que el host sea correcto (localhost o 127.0.0.1)

