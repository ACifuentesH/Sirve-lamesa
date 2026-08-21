# Configuración

Para el panorama general y la arquitectura, ver [`README.md`](README.md). Esto es el
paso a paso.

## Paso 1 — Instalar dependencias

```bash
npm install
```

Instala también las de `angular-app/` (lo hace el `postinstall` de la raíz).

## Paso 2 — Crear el proyecto de Supabase

En [supabase.com](https://supabase.com), crea un proyecto y anota:

- **Project URL** — Project Settings → Data API.
- **Clave publicable (anon)** — misma pantalla.
- **Cadena de conexión** — botón *Connect*, o Project Settings → Database.

> La clave que va en el `.env` es la **publicable/anon**, nunca la `service_role`:
> esta última viaja al navegador con el bundle y daría acceso total al estudio.
> Lo que protege los datos son las políticas RLS (migraciones 009 y 012–014), no el
> secreto de la clave.

## Paso 3 — Crear el `.env`

Copia `.env.example` a `.env` y rellena:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=...
URL_FUNDACION=https://www.fundacionayudate...

DATABASE_URL=postgresql://postgres.PROJECT_REF:TU_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Dos usos distintos en un mismo archivo:

| Variable | Para qué |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `URL_FUNDACION` | Se inyectan en `angular-app/src/environments/` antes de cada `start` y cada `build` |
| `DATABASE_URL` | Solo para aplicar migraciones y seeds |

**Verifica que el ref del proyecto sea el mismo en las dos.** Si `DATABASE_URL`
apunta a un proyecto y `SUPABASE_URL` a otro, las migraciones se aplican donde no
tocan y la aplicación arranca contra un esquema que no las tiene. Ya ocurrió una vez.

`src/environments/environment.ts` y `environment.prod.ts` están en `.gitignore`
porque los genera el script: no se editan a mano ni se versionan.

## Paso 4 — Preparar la base de datos

Ver [`INICIALIZACION-BD.md`](INICIALIZACION-BD.md).

## Paso 5 — Levantar la aplicación

```bash
npm start
```

En `http://localhost:4200`. La aplicación habla directamente con Supabase: no hay
servidor propio que levantar, ni proxy, ni segundo terminal.

## Paso 6 — Comprobar

1. `http://localhost:4200/registro` carga el formulario de alta.
2. `http://localhost:4200/simulador` muestra banner, avatar, menú y plato. Si el menú
   sale vacío, faltan los seeds del paso 4.
3. `http://localhost:4200/investigadores` pide sesión de investigador.

## Problemas frecuentes

**El menú lateral aparece vacío**
El catálogo no está cargado, o `anon` no tiene SELECT sobre `catalogo_alimentos`.
Ejecuta `database/seeds/seed_catalogo_alimentos.sql` y comprueba las migraciones 009
y 012.

**"El pool de personajes está vacío"**
Falta `database/seeds/seed_personajes.sql`. El simulador toma el pool de los
personajes que tienen `slug`; los personajes viejos no lo tienen a propósito.

**Los alimentos salen sin imagen**
Las 34 imágenes del catálogo son marcadores provisionales mientras llega el material
definitivo (issue #15). Ver `angular-app/src/assets/foods/README.md`.

**El panel de investigadores devuelve cero filas sin error**
O el estudio está vacío, o la cuenta no está en la lista blanca de investigadores
(migración 013). No es un fallo de red.

**`getaddrinfo ENOENT` al aplicar migraciones**
La conexión directa `db.xxxxx.supabase.co` a veces solo resuelve por IPv6. Usa la
cadena del *session pooler*, que es IPv4.

**El build arranca sin credenciales**
El script de inyección avisa por consola cuando genera los environments sin
`SUPABASE_URL` o `SUPABASE_ANON_KEY`. Revisa que el `.env` esté en la raíz del repo.
