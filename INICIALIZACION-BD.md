# 🗄️ Inicialización de Base de Datos - Sirve la Mesa

## 📌 Cambio Importante

A partir de ahora, **el servidor ya NO inicializa automáticamente la base de datos** al arrancar. Esto permite que tus datos persistan entre reinicios del servidor.

---

## 🚀 Comando de Inicialización

Para crear o resetear la base de datos, usa:

```powershell
npm run init-db
```

Este comando:
- ✅ Elimina todas las tablas existentes
- ✅ Crea la estructura completa de la base de datos
- ✅ Inserta los datos iniciales (seed data)
- ✅ Muestra un resumen de las tablas creadas

---

## ⚠️ Cuándo usar este comando

### ✅ Debes ejecutarlo en estos casos:

1. **Primera vez que configuras el proyecto**
   - Después de clonar el repositorio
   - Después de instalar las dependencias

2. **Cuando necesites resetear la base de datos**
   - Tienes datos corruptos
   - Quieres empezar de cero
   - Actualizaste la estructura de las tablas

3. **Después de cambios en la estructura**
   - Modificaste `schema.sql`
   - Agregaste nuevas tablas
   - Cambiaste relaciones

### ❌ NO lo ejecutes:

- Cada vez que inicies el servidor
- Si tienes datos importantes que quieres conservar
- Durante el desarrollo normal (los datos ya persisten)

---

## 🔄 Flujo de Trabajo Normal

### Primera vez (configuración inicial):

```powershell
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Copiar .env.example a .env y ajustar valores

# 3. Inicializar base de datos (SOLO UNA VEZ)
npm run init-db

# 4. Iniciar servidor
npm run dev
```

### Desarrollo diario:

```powershell
# Simplemente iniciar el servidor (los datos persisten)
npm run dev
```

---

## 📊 ¿Qué hace el script de inicialización?

El script `init-database.js` ejecuta los siguientes archivos SQL en orden:

1. **`database/schema.sql`**
   - Elimina tablas existentes (DROP TABLE)
   - Crea estructura de tablas con relaciones
   - Define índices y constraints

2. **`database/participantes.sql`**
   - Define la tabla de participantes

3. **`database/sesiones_juego.sql`**
   - Define la tabla de sesiones
   - Crea triggers automáticos

4. **`database/decisiones_porcionamiento.sql`**
   - Define la tabla de decisiones
   - Configura índices para JSONB

5. **`database/seed_data.sql`**
   - Inserta datos iniciales:
     - Personajes sintéticos (8)
     - Menús (Desayuno, Almuerzo, Cena)
     - Bebidas (~19)
     - Componentes/Ingredientes (~180)
     - Platos del menú
     - Relaciones entre entidades

---

## 🛡️ Seguridad

El script incluye:
- ⏳ Pausa de 3 segundos antes de ejecutar (permite cancelar con Ctrl+C)
- ⚠️ Advertencia clara sobre eliminación de datos
- ✅ Confirmación de tablas creadas
- 📝 Logs detallados del proceso

---

## 🐛 Solución de Problemas

### Error: "No se puede conectar a PostgreSQL"

```powershell
# Verificar que PostgreSQL esté corriendo
# En servicios de Windows o con:
pg_isready
```

### Error: "Database does not exist"

```powershell
# Crear la base de datos manualmente
psql -U postgres
CREATE DATABASE sirve_la_mesa;
\q

# Luego ejecutar
npm run init-db
```

### Error: "Permission denied"

```powershell
# Verificar credenciales en .env
# DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/sirve_la_mesa
```

### Quiero conservar algunos datos

Si necesitas conservar ciertos datos:

1. **Exporta los datos importantes primero:**
   ```powershell
   # Desde el panel admin (http://localhost:3000/admin)
   # Hacer clic en "📥 Descargar CSV (Excel)"
   ```

2. **Ejecuta la inicialización:**
   ```powershell
   npm run init-db
   ```

3. **Reimporta los datos manualmente** usando SQL o la API

---

## 📚 Archivos Relacionados

- **`init-database.js`** - Script de inicialización (en la raíz)
- **`server.js`** - Servidor principal (ya NO ejecuta init automáticamente)
- **`database/*.sql`** - Scripts SQL de estructura y datos
- **`package.json`** - Define el comando `npm run init-db`

---

## 💡 Consejos

1. **Backup de datos importantes**: Antes de ejecutar `npm run init-db`, exporta tus datos desde el panel admin.

2. **Entorno de desarrollo vs producción**: En producción, usa migraciones en lugar de resetear toda la BD.

3. **Versionamiento**: Los archivos SQL en `database/` están versionados en Git. Los datos NO.

4. **Seed data personalizado**: Modifica `database/seed_data.sql` para agregar tus propios datos iniciales.

---

## 📞 Soporte

Si tienes problemas con la inicialización de la base de datos, verifica:

1. ✅ PostgreSQL está corriendo
2. ✅ Variables de entorno en `.env` son correctas
3. ✅ Base de datos `sirve_la_mesa` existe
4. ✅ Usuario tiene permisos suficientes
5. ✅ No hay conexiones activas bloqueando las tablas
