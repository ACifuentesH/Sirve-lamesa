# Integración por `<iframe>` — Sirve la Mesa

Documento para el equipo web de la Fundación: cómo incrustar el simulador en su
sitio. Corresponde al entregable de la §7.2 del plan de desarrollo (issue #23,
tarea A9).

## El snippet

```html
<iframe
  src="https://TU-DEPLOY.vercel.app/"
  title="Simulador Sirve la Mesa"
  width="100%"
  height="100%"
  style="min-width: 360px; min-height: 700px; border: 0;"
  loading="eager"
></iframe>
```

Notas sobre cada pieza:

- **`src`**: la URL del build desplegado. En Vercel: proyecto con raíz
  `angular-app/`, build command `npm run build:vercel` (genera
  `environment.prod.ts` desde variables de entorno y compila), output
  directory `dist/sirve-la-mesa`, y las tres variables de
  `angular-app/.env.example` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `URL_FUNDACION`) configuradas en el dashboard del proyecto de Vercel — ver
  `CONFIGURACION.md`. El `src` puede apuntar a la raíz del deploy o a cualquier subruta
  del sitio de la Fundación que sirva el `dist/` de Angular — el build resuelve
  todos sus assets con rutas **relativas** (`base href="./"`), así que funciona
  igual sin importar el subdirectorio desde el que se sirva. Ver la sección de
  verificación más abajo.
- **`title`**: obligatorio por accesibilidad (lectores de pantalla). Ajustar el
  texto si la Fundación prefiere otro.
- **`width` / `height`**: pensados para que el contenedor padre le dé al
  `iframe` toda el área disponible. El `min-width`/`min-height` en `style`
  evita que quede recortado en contenedores muy pequeños (ver "Dimensiones
  mínimas" abajo).
- **`allow`**: **no se incluye porque hoy no hace falta.** El simulador no usa
  cámara, micrófono, geolocalización ni portapapeles — solo `localStorage` (en
  el propio origen del `iframe`, sin relación con el origen de la página que lo
  embebe) y llamadas de red a Supabase. Si en el futuro se agrega una función
  que necesite un permiso de navegador, hay que declararlo aquí explícitamente
  (p. ej. `allow="clipboard-write"`), no dejarlo implícito.
- **`loading="eager"`**: el simulador es el contenido principal de la página
  donde se incruste, no un widget secundario fuera de pantalla. Si la
  Fundación lo coloca más abajo en una página larga, puede cambiar a
  `loading="lazy"` sin problema.
- **`sandbox`**: no se incluye en el snippet por defecto (restringiría de más
  sin necesidad). Si el equipo de la Fundación quiere endurecerlo, el mínimo
  que el simulador necesita para funcionar es
  `sandbox="allow-scripts allow-same-origin allow-forms"`.

## Dimensiones mínimas

Las pantallas del simulador (registro, onboarding, servicio, salida) están
maquetadas a `min-height: 100vh` sobre un `body` con `overflow: hidden` — es
decir, el simulador asume que ocupa **todo el viewport que se le da** (dentro
de un `iframe`, ese viewport es el del propio `iframe`, no el de la página que
lo contiene). Si el `iframe` es más bajo que el contenido, el simulador no
agrega scroll de página: el contenido puede quedar recortado.

Los breakpoints internos (`admin`, `simulador`, `personajes`, `login`) bajan
hasta los 400–480px de ancho, así que el simulador es usable en un `iframe`
angosto (móvil), pero:

- **Ancho mínimo recomendado: 360px** (el móvil más angosto que soportan los
  breakpoints existentes).
- **Alto mínimo recomendado: 700px.** Con menos altura, en pantallas donde el
  contenido es más alto que ancho (el simulador de plato, por ejemplo) el
  recorte es visible.
- Lo ideal es que el `iframe` tome el 100% del ancho de su contenedor y una
  altura ligada al viewport de la página anfitriona (`height: 100vh` o
  `100dvh` en el `iframe`, o un contenedor flex que le dé todo el alto
  disponible), no una altura fija pequeña.

## Comportamiento responsive

El simulador ya es responsive puertas adentro (cada pantalla tiene sus propios
`@media` queries). Del lado del `iframe` no hace falta lógica adicional más
allá de:

1. Que el `iframe` mismo sea fluido (`width: 100%`) en vez de un ancho fijo en
   píxeles.
2. Respetar los mínimos de la sección anterior — un `iframe` más angosto que
   360px no tiene garantía de que el simulador se vea bien, porque ningún
   breakpoint interno baja de ahí.
3. Nada de `transform: scale()` sobre el `iframe` para "encogerlo": eso rompe
   los cálculos de `vh` internos. Si hace falta más compacto, mejor angosto
   (el simulador ya responde a eso) que escalado.

## CSP / quién puede embeber el simulador (`frame-ancestors`)

`angular-app/vercel.json` incluye una cabecera `Content-Security-Policy` con
`frame-ancestors` que restringe **qué orígenes pueden poner el simulador
dentro de un `iframe`**. Hoy tiene un placeholder:

```
frame-ancestors 'self' http://localhost:* https://REEMPLAZAR-CON-DOMINIO-REAL-DE-LA-FUNDACION.example
```

**Antes de que la Fundación pueda embeber el simulador en producción, alguien
con el dominio real tiene que reemplazar
`REEMPLAZAR-CON-DOMINIO-REAL-DE-LA-FUNDACION.example` en `angular-app/vercel.json`
por el dominio real del sitio donde va a vivir el `<iframe>`** (por ejemplo
`https://fundacionejemplo.org`). Es el único lugar del repo donde vive ese
valor — no hay que tocar nada más. Mientras el placeholder siga ahí, un
navegador que respete `frame-ancestors` (todos los navegadores modernos)
**rechazará mostrar el simulador embebido desde cualquier dominio real**,
aunque el `src` del `iframe` sea correcto. `http://localhost:*` queda
permitido siempre, para poder seguir probando en local sin tocar este archivo.

Esta cabecera solo la envía el deploy en Vercel — servir el `dist/` con
cualquier otro servidor estático (como en la verificación local de este
documento) no la aplica, así que las pruebas locales no se ven afectadas por
este candado.

## Página de prueba local

`docs/iframe-test/index.html` es un arnés de prueba standalone (sin
dependencias, abre directo en el navegador) que pone el simulador dentro de un
`<iframe>` con el snippet de arriba y deja cambiar la URL del `src` y el
tamaño del contenedor (móvil / tablet / escritorio) para revisar visualmente
el comportamiento responsive. Instrucciones de uso dentro del propio archivo.

## Qué se verificó y qué queda pendiente

**Verificado para este documento (issue #23 / A9):**

- El build de producción (`ng build --configuration production`, con
  `baseHref: "./"` ya configurado en `angular-app/angular.json`) resuelve
  **todos** sus assets — bundles JS/CSS, fuentes, imágenes de personajes e
  ingredientes, chunks lazy de cada ruta — con rutas relativas. Se copió el
  `dist/` a una ruta anidada arbitraria (`/embed-demo/sub1/sub2/`) servida por
  un servidor estático plano y cada asset devolvió `200` **solo** bajo esa
  ruta anidada (pedirlos desde la raíz del servidor devuelve `404`, lo que
  descarta que estuvieran resolviendo por una ruta absoluta accidental).

**Pendiente, fuera del alcance de este ticket:**

- El criterio "dentro del `iframe` el flujo completo pasa de registro a
  pantalla de salida" **no se verificó de punta a punta** porque el issue #23
  está bloqueado por el #22 (B9 — validaciones, cronómetro y compilación del
  payload de la vía B), que todavía no está implementado. Sin B9 el flujo se
  interrumpe antes de llegar a la pantalla de salida. Esta verificación queda
  pendiente de que #22 se cierre.
- El dominio real de la Fundación (para `frame-ancestors` arriba) — placeholder
  documentado, pendiente de que alguien con ese dato lo complete.
- No se restringió el CORS del backend Express legado (`server.js`): la app
  actual habla directo con Supabase desde el navegador (ver
  `CONFIGURACION.md`), así que ese backend no es parte del camino de
  despliegue de este entregable. Si sigue en uso para otra cosa, es un tema
  aparte de A9.
