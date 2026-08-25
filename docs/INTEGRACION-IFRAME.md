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
  style="min-width: 372px; border: 0;"
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
  `iframe` toda el área disponible. El `min-width` en `style` evita que quede
  recortado en contenedores muy angostos (ver "Dimensiones mínimas" abajo). A
  propósito **no lleva un `min-height` fijo** — la misma sección explica por
  qué un número de alto fijo estaría mal para algún ancho.
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

Las cinco pantallas que existen hoy en el flujo son `registro`, `onboarding`,
`simulador`, `salida` e `investigadores` (rutas reales en
`angular-app/src/app/app-routing.module.ts`, que está congelado y no se toca
para este documento). Las medidas de esta sección salen de esas cinco, **no**
de `admin`, `personajes` ni `login`: `personajes` y `login` se borraron en el
PR #44 y `admin` se renombró a `investigadores` en el #34 (queda una
redirección `/admin` → `/investigadores` para enlaces viejos, pero no es una
pantalla).

Cuatro de las cinco (`registro`, `onboarding`, `simulador`, `salida`) están
maquetadas a `min-height: 100vh` sobre un `body` con `height: 100vh; overflow:
hidden` (`angular-app/src/styles.scss:33-37`) — el simulador asume que ocupa
**todo el viewport que se le da** (dentro de un `iframe`, ese viewport es el
del propio `iframe`, no el de la página que lo contiene) y **no hay scroll de
página**: si el contenido no cabe, se recorta en silencio, sin barra de
scroll. La excepción es `investigadores`, que abre su propio scroll interno
(`investigador.component.scss:4-5`, `.investigador-wrapper { height: 100vh;
overflow-y: auto; }`) y por eso tolera mejor un `iframe` bajo que las otras
cuatro.

### Ancho mínimo: 372px

A diferencia del alto, esto sí es un número exacto: sale de sumar reglas CSS
declaradas, no de una estimación. La pantalla que más ancho pide es
`registro` (el formulario de alta del participante):

- `.registro { padding: t.$space-5; }` — `$space-5: 1.5rem` = 24px
  (`angular-app/src/styles/_tokens.scss:40`) × 2 lados = **48px**
  (`registro.component.scss:4-8`).
- `.tarjeta { padding: t.$space-6; }` — `$space-6: 2rem` = 32px
  (`_tokens.scss:41`) × 2 lados = **64px** (`registro.component.scss:11-17`).
- `.grilla { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }`
  (`registro.component.scss:33`) — cada columna del formulario pide al menos
  **260px**.

48 + 64 + 260 = **372px**. Por debajo de eso el navegador no tiene ancho para
ni siquiera una columna de 260px y el formulario se recorta horizontalmente.

Las otras cuatro piden menos ancho:

- `onboarding` y `salida` comparten la misma tarjeta (padding 24px + 32px =
  112px) pero no tienen ningún `min-width`/`minmax` propio dentro — el texto
  simplemente envuelve, así que no imponen un piso por encima de esos 112px.
- `simulador`: el único `min-width` explícito es el botón
  `.finalizar { min-width: 220px; }` (`simulador.component.scss:97`), dentro
  de `.tablero { padding: 1.25rem 1.5rem 2rem; }` (línea 15; 1.5rem = 24px ×
  2 lados = 48px). 220 + 48 = 268px. El grid de tres columnas
  (`minmax(140px,220px) minmax(0,1fr) minmax(280px,360px)`, línea 13) solo se
  usa por encima de 1100px de ancho: por debajo, `@media (max-width: 1100px)`
  (línea 121) lo colapsa a una sola columna, así que ese `minmax` de
  280–360px no aplica al rango de anchos realista para un `iframe` embebido.
- `investigadores`: `.filter-item { min-width: 140px; }`
  (`investigador.component.scss:130`) dentro de
  `.filters-bar { padding: 14px 18px; }` (línea 115, 18px × 2 = 36px) dentro
  de `.investigador-body { padding: 12px 12px 28px; }` en
  `@media (max-width: 768px)` (línea 556, 12px × 2 = 24px). 140 + 36 + 24 =
  200px.

372px es el mayor de los cinco, así que es el número que gobierna el ancho
mínimo del `iframe`. **Sube 12px respecto a los 360px del documento
anterior** — esos 360px no correspondían a ninguna regla CSS de las
pantallas actuales (venían de pantallas ya borradas o renombradas).

### Alto: no hay un piso fijo en el CSS

A diferencia del ancho, ninguna de las cinco pantallas declara un
`min-height` en píxeles: todas usan `min-height: 100vh`, que es relativo al
propio `iframe`, no un número absoluto. Los 700px del documento anterior
tampoco salían de una regla CSS — eran una cifra suelta, sin nada que la
respalde en el código actual.

Contando el contenido real de hoy sí se puede acotar el orden de magnitud:

- **`registro` a 372px de ancho** (el piso de la sección anterior) solo deja
  sitio para **una** columna en `.grilla`: 260px de columna no dejan lugar
  para una segunda de 260px más el `gap` de `$space-4` (16px,
  `registro.component.scss:34`). Con una sola columna, los **9 campos** del
  formulario (`registro.component.html`: edad, peso, estatura, género, nivel
  de estudios, semestre —condicional—, etnia, región de origen, región de
  residencia) se apilan uno debajo del otro en vez de repartirse en 2–3
  columnas. Sumando esos 9 campos más el título, la intro, el bloque de
  consentimiento y el botón "Continuar", el alto para no recortar nada ronda
  **1000–1100px**. No es un número exacto porque la altura de un
  `<input>`/`<select>` la decide el navegador (el proyecto no fija
  `line-height` ni `height` en esos elementos, solo `padding`), pero la
  magnitud se puede verificar cargando el build a 372px de ancho.
  - Si el `iframe` es más ancho (≥ ~648px = 2×260px + 16px de `gap` + 64px +
    48px de los paddings de arriba), `.grilla` pasa a 2 columnas, el
    formulario baja de 9 a 5 filas, y el alto necesario cae a **~700px** —
    casualmente el número del documento anterior, pero solo es válido a ese
    ancho, no a 360/372px.
- **`simulador` a 372px de ancho** también pide bastante más de 700px, por
  una combinación de piezas de tamaño fijo o casi fijo:
  - Avatar del personaje: `max-width: 260px; aspect-ratio: 1 / 1;`
    (`avatar-personaje.component.ts`, estilos inline del componente) — hasta
    260px de alto, más el nombre y el perfil debajo.
  - Contenedor de bebida: `.vaso { width: 110px; height: 150px; }`
    (`contenedor-bebida.component.ts`) — tamaño fijo, no se achica con el
    viewport.
  - Plato: `.plato { width: min(420px, 42vw, 70vh); aspect-ratio: 1 / 1; }`
    (`plato-canvas.component.ts`) — este sí se achica con el ancho y el alto
    disponibles, por eso no es la pieza más restrictiva a anchos angostos.
  - Menú lateral: en el peor caso, un grupo de alimentos trae **4
    alimentos** (contado directo de
    `database/seeds/seed_catalogo_alimentos.sql`; p. ej. "Proteínas y
    Lácteos" en desayuno o "Proteínas y Legumbres" en almuerzo), cada fila
    con una foto fija de 56×56px (`.foto`, `menu-lateral.component.scss`).
  - Sumando el banner de contexto fijo arriba (`banner-contexto.component.ts`,
    `position: sticky`) y los `padding`/`gap` de `.tablero` y `.servicio`, el
    alto para no recortar nada en `simulador` a 372px de ancho también ronda
    **1100–1200px**.
- `onboarding` y `salida` tienen bastante menos texto que `registro` y no se
  cuantificaron en detalle porque no son el caso más exigente.
- `investigadores` no depende de esto de la misma forma: como scrollea
  internamente (`.investigador-wrapper`, arriba), un `iframe` bajo no le
  recorta contenido — solo le da menos alto visible antes de que aparezca su
  propia barra de scroll.

**Por eso el snippet de arriba no trae `min-height`.** Fijar un solo número
(700px, 1100px o cualquier otro) va a estar mal para algún ancho: a 372px
hace falta ~1100px, a ~650px alcanza con ~700px, y entre medio hay un rango
continuo — el alto y el ancho mínimos no son independientes entre sí en este
proyecto. La recomendación real es la que ya daba la sección siguiente: no
fijar el alto, dejar que el `iframe` tome `height: 100%` (o `100vh`/`100dvh`)
del contenedor de la Fundación, no una altura fija pequeña. Si el equipo de
la Fundación necesita igual un valor estático de respaldo, que presupueste
**al menos ~1100px** si usa el ancho mínimo de 372px, o **al menos ~700px**
si usa un ancho de ~650px o más — y que lo valide contra el build real,
porque esta cifra depende del contenido de hoy (número de campos del
formulario, tamaño del catálogo de alimentos) y cambia si ese contenido
cambia.

## Comportamiento responsive

El simulador ya es responsive puertas adentro, aunque no todas las pantallas
lo resuelven de la misma forma: `registro`, `onboarding` y `salida` no
declaran ningún `@media` — se ajustan solas con `grid`/`min()`/anchos en `%`.
`simulador` tiene un único `@media (max-width: 1100px)` (colapsa su grid de
tres columnas) e `investigadores` tiene dos, en 768px y 480px (ver
"Dimensiones mínimas" arriba). Del lado del `iframe` no hace falta lógica
adicional más allá de:

1. Que el `iframe` mismo sea fluido (`width: 100%`) en vez de un ancho fijo en
   píxeles.
2. Respetar el mínimo de la sección anterior — un `iframe` más angosto que
   372px hace que el formulario de `registro` (la pantalla más exigente en
   ancho) se recorte, porque `.grilla` ya no tiene sitio ni para una columna
   de 260px.
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
- Los rangos de alto de "Dimensiones mínimas" (1000–1100px para `registro`,
  1100–1200px para `simulador`, ambos a 372px de ancho) salen de contar
  elementos y sumar sus reglas CSS, **no de medir en un navegador real**. Son
  el orden de magnitud correcto, pero si alguien necesita el píxel exacto
  para un caso concreto, hay que cargar el build a ese ancho y leer
  `document.documentElement.scrollHeight`.
