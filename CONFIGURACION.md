# 🔧 Guía de Configuración - Sirve la Mesa

La app que se despliega y se embebe en `<iframe>` (ver
`docs/INTEGRACION-IFRAME.md`) es el Angular estático en `angular-app/`, que
habla **directo con Supabase desde el navegador** — no pasa por el backend
Express de la raíz del repo. Esta guía cubre esa ruta primero. La segunda
mitad documenta el backend Express + PostgreSQL local (`server.js`), que es
infraestructura anterior y hoy no es parte del camino de despliegue del
simulador.

## Parte 1 — Angular + Supabase (la app que se despliega)

### Qué variables hacen falta

Tres, todas consumidas por `angular-app/scripts/inject-supabase-env.mjs`:

| Variable | Para qué | Si falta |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase (Project Settings → API) | El cliente de Supabase queda sin URL: toda llamada a la BD falla en tiempo de ejecución |
| `SUPABASE_ANON_KEY` | Clave **publicable** (`sb_publishable_...`), no la `anon` heredada — ver nota abajo | Igual que arriba: sin credencial, no hay conexión a Supabase |
| `URL_FUNDACION` | URL de la web de la Fundación a la que vuelve el botón de la pantalla de salida | El botón de salida no navega a ningún lado (no rompe nada, simplemente no hace nada — ver `angular-app/src/app/components/salida/salida.component.ts`) |

**Nota sobre la clave:** el repo es público. La clave `anon` (JWT) que
alguna vez estuvo versionada en `environment.ts` quedó comprometida para
siempre por eso — no se debe reintroducir. Usar la clave **publicable**
(`sb_publishable_...`) de Supabase, pensada justamente para vivir en código
cliente.

### Dónde ponerlas

`angular-app/.env` (fuera de git — `.gitignore` de `angular-app/` no lo lista
explícitamente porque no hace falta: el archivo nunca se craa por defecto y el
`.gitignore` raíz de git ya trata cualquier `.env` como no versionado por
convención del equipo; en cualquier caso, **nunca commitear este archivo**).
No existe en el repo por defecto — crearlo copiando la plantilla:

```powershell
Copy-Item angular-app\.env.example angular-app\.env
```

y completar los tres valores. `angular-app/.env.example` ya documenta cada
uno (incluida la nota de que `URL_FUNDACION` está pendiente del dato real,
issue #1).

En CI/Vercel, las mismas tres variables se configuran como variables de
entorno del proyecto (no como archivo) — Vercel las inyecta al proceso de
build.

### Cómo se generan `environment.ts` / `environment.prod.ts`

`angular-app/src/environments/` **no está versionado** (ver
`.gitignore` — antes sí lo estaba, con la clave adentro; de ahí la nota de
arriba) y **no existe hasta que se genera**. Lo genera
`angular-app/scripts/inject-supabase-env.mjs`, que:

1. Lee `angular-app/.env` si existe (parser mínimo propio, no usa
   `dotenv`). Las variables ya presentes en el entorno del proceso mandan
   sobre el archivo — así un pipeline de CI con las variables ya exportadas
   no depende de que nadie suba un `.env` por error.
2. Con `--dev` escribe `environment.ts` (para `ng serve` / build local);
   sin el flag escribe `environment.prod.ts` (para el build de producción).

Esto corre solo automáticamente vía los scripts `pre*` de
`angular-app/package.json` (`prestart`, `prebuild`, `prebuild:prod`,
`prewatch`, y dentro de `build:vercel`) — no hace falta invocarlo a mano en
el flujo normal.

**Si `angular-app/.env` no existe y no hay variables exportadas** (el estado
por defecto de un clon nuevo del repo, verificado en esta máquina): el script
**no falla** — genera igual `environment.ts` / `environment.prod.ts`, pero
con los tres campos como cadena vacía, y avisa por consola:

```
⚠️  environment.ts generado SIN credenciales: falta SUPABASE_URL o SUPABASE_ANON_KEY. Copia .env.example a .env y rellénalo.
```

El build de Angular **compila igual** con esos valores vacíos (son strings
válidos), pero la app en el navegador falla en cualquier llamada a Supabase
en tiempo de ejecución, y el botón de la pantalla de salida queda inerte. Para
levantar la app de verdad hace falta el `.env` completo.

### Comandos

```powershell
cd angular-app
Copy-Item .env.example .env    # completar SUPABASE_URL / SUPABASE_ANON_KEY / URL_FUNDACION
npm install
npm start                       # ng serve, genera environment.ts automáticamente (prestart)
```

Build de producción (el mismo que corre Vercel vía `build:vercel`):

```powershell
npm run build:prod
```

El resultado en `angular-app/dist/sirve-la-mesa/` ya sale con `base href="./"`
(configurado en `angular-app/angular.json`, configuración `production`) — ver
`docs/INTEGRACION-IFRAME.md` para el despliegue y la incrustación en
`<iframe>`.

## Parte 2 — Backend Express + PostgreSQL local (legado)

El repo también incluye un backend Express (`server.js`) con su propio
esquema PostgreSQL (`database/`), de una etapa anterior del proyecto (era el
receptor de un cliente Godot). La app Angular actual **no lo usa** para nada
del flujo de datos — habla directo con Supabase (Parte 1). Si de todas formas
hace falta levantarlo (desarrollo de algo que sí lo consuma, o revisión de
datos legados):

### Paso 1: Configurar la Base de Datos en pgAdmin

1. **Abre pgAdmin** y conecta a tu servidor PostgreSQL
2. **Busca tu base de datos** (probablemente se llama `sirve_la_mesa` o similar)
3. **Clic derecho en la base de datos → Properties** para ver los detalles

Datos que hacen falta: host (`localhost` normalmente), puerto (`5432` por
defecto), nombre de la base, usuario y contraseña.

### Paso 2: Crear el archivo `.env` (en la raíz del repo, no en `angular-app/`)

```powershell
Copy-Item .env.example .env
```

y completar `DATABASE_URL` (ver los ejemplos comentados en
`.env.example`, incluidos los de conexión directa vs. pooler de Supabase si
la base vive ahí en vez de en un Postgres local). El resto de variables
(`PORT`, `NODE_ENV`, `CLIENT_URL`) ya traen un valor por defecto razonable en
la plantilla.

### Paso 3: Instalar dependencias e inicializar la base

```powershell
npm install
npm run init-db
```

**Corrección sobre versiones anteriores de este documento:** `npm start`
**no** crea las tablas automáticamente. Hay que correr `npm run init-db`
explícitamente al menos una vez — el script (`init-database.js`) borra y
recrea el esquema completo (`database/schema.sql` y compañía) y carga los
datos semilla. Correrlo dos veces no debería duplicar filas en `Menu` (tiene
`ON CONFLICT` con target), pero sí puede duplicar en otras tablas cuyo seed
no tiene un `UNIQUE` — ver `PLAN-DESARROLLO-UX-2026.md`, sección de deuda
técnica, si eso importa para el caso de uso.

### Paso 4: Iniciar el servidor

```powershell
npm start
```

Queda disponible en `http://localhost:3000`. Verificar con
`http://localhost:3000/api/health` y `http://localhost:3000/api/test-connection`.

### Solución de problemas

- **"password authentication failed"**: contraseña incorrecta en `.env`, o el
  usuario no tiene permisos sobre la base.
- **"database does not exist"**: el nombre en `DATABASE_URL` no coincide con
  el que existe en el servidor.
- **"connection refused"**: PostgreSQL no está corriendo, o el host/puerto en
  `DATABASE_URL` están mal.
- **CORS**: `server.js` hoy acepta cualquier origen (`callback(null, true)`
  incondicional pese al filtro de lista blanca que aparenta tener el código).
  No se tocó como parte de A9 porque este backend no es parte del camino de
  despliegue del simulador — si se retoma su uso, revisar esa configuración
  aparte.
