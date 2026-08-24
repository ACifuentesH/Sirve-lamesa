# Sirve la Mesa

Instrumento de investigación en psicología de la alimentación. Un participante sirve
comida a un personaje sintético y el sistema registra **qué, cuánto y en qué orden**
sirve, para detectar sesgos de porcionamiento según las características
sociodemográficas del personaje.

La metáfora de restaurante es el estímulo del experimento, no el dominio: no hay
meseros, clientes ni pedidos reales. El vocabulario del proyecto está en
[`CONTEXT.md`](CONTEXT.md) y conviene leerlo antes de tocar código.

## Arquitectura

**Angular 19 (SPA) + Supabase (Postgres).** No hay servidor propio.

```
Navegador ── Angular ──► Supabase
                          ├── lectura  : SELECT sobre tablas de estímulo y sobre
                          │              la vista respuestas_experimento
                          └── escritura: RPC registrar_respuesta_experimento
```

Las dos decisiones que explican esta forma:

- [`docs/adr/0001-supabase-sin-express.md`](docs/adr/0001-supabase-sin-express.md) —
  el envío del participante va por una RPC transaccional, no por un backend propio.
- [`docs/adr/0002-angular-frente-a-lovable-react.md`](docs/adr/0002-angular-frente-a-lovable-react.md)
- [`docs/adr/0003-vista-respuestas-experimento.md`](docs/adr/0003-vista-respuestas-experimento.md) —
  `respuestas_experimento` es una vista, y es lo que leen el panel y las exportaciones.

El backend Express, Socket.IO, el panel estático de `public/`, los HTML de AngularJS
de la raíz y el esqueleto de React se retiraron del árbol de trabajo en el issue #24.
Siguen en el historial de git si hiciera falta consultarlos.

## Flujo del participante

| Ruta | Pantalla |
|---|---|
| `/registro` | Alta anónima con datos antropométricos y sociodemográficos + consentimiento |
| `/onboarding` | Instrucciones, con el botón bloqueado 5 s para forzar la lectura |
| `/simulador` | La tarea: banner de asignación, avatar, menú lateral, plato de 4 cuadrantes y contenedor de bebida |
| `/salida` | Cierre sostenido, sin redirección automática |

El participante **nunca se autentica**. Solo los investigadores tienen sesión:

| Ruta | Pantalla |
|---|---|
| `/acceso-investigadores` | Inicio de sesión del investigador |
| `/investigadores` | Panel de análisis y exportación (CSV / JSON / Excel) |

## Puesta en marcha

### Requisitos

- Node.js >= 18
- Un proyecto de Supabase

### 1. Instalar dependencias

```bash
npm install
```

Instala también las de `angular-app/` mediante el `postinstall`.

### 2. Configurar el entorno

Copia `.env.example` a `.env` y rellena los valores. Ese archivo alimenta dos cosas
distintas:

- **`DATABASE_URL`** — solo para aplicar migraciones y seeds contra Postgres.
- **`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `URL_FUNDACION`** — los inyecta
  `angular-app/scripts/inject-supabase-env.mjs` en `src/environments/`, que están
  fuera de git a propósito: las claves no se versionan.

La inyección corre sola antes de `start` y de `build`, así que no hay que invocarla a
mano. Si el `.env` cambia, el siguiente `npm start` la vuelve a aplicar.

> Comprueba que el ref del proyecto en `DATABASE_URL` es **el mismo** que el de
> `SUPABASE_URL`. Ya ocurrió una vez que el `.env` apuntaba a un proyecto viejo y las
> migraciones se aplicaron donde no tocaba.

### 3. Preparar la base de datos

Ver [`INICIALIZACION-BD.md`](INICIALIZACION-BD.md): migraciones de `database/migrations/`
en orden, y después los seeds de `database/seeds/`.

### 4. Levantar la aplicación

```bash
npm start          # ng serve en http://localhost:4200
npm run build      # build de producción en angular-app/dist/sirve-la-mesa/
```

## Estructura

```
angular-app/src/app/
├── components/
│   ├── registro/                # A3 — alta del participante
│   ├── onboarding/              # A4 — instrucciones con bloqueo de 5 s
│   ├── simulador/               # B3-B9 — la tarea de servicio
│   │   ├── banner-contexto/     #   asignación, con concordancia gramatical
│   │   ├── avatar-personaje/    #   retrato del personaje asignado
│   │   ├── menu-lateral/        #   catálogo del momento del día, en pestañas
│   │   ├── plato-canvas/        #   reparto determinista en 4 cuadrantes
│   │   └── contenedor-bebida/   #   la bebida, siempre fuera del plato
│   ├── confirmacion-modal/      # A5 — confirmación de dos pasos
│   ├── salida/                  # A6 — cierre sostenido
│   ├── acceso-investigadores/   # sesión del investigador
│   └── investigador/            # A8 — panel de análisis y exportación
├── services/
│   ├── supabase.service.ts      # cliente único de Supabase
│   ├── catalogo.service.ts      # catálogo por momento del día + pool de personajes
│   ├── asignacion.service.ts    # sorteo de personaje y momento
│   ├── plato.service.ts         # estado vivo del plato y secuencia de clics
│   ├── envio.service.ts         # A7 — envío con reintentos y respaldo local
│   ├── api.service.ts           # lecturas del panel sobre respuestas_experimento
│   ├── participante.service.ts
│   └── investigador.service.ts
├── models/contrato/             # contrato de datos congelado (Fase 0)
└── utils/                       # cuadrantes, concordancia del banner, exportación

database/
├── migrations/                  # esquema, vista y RPC, en orden
└── seeds/                       # 8 personajes + 34 alimentos
```

## Documentación

| Documento | Qué contiene |
|---|---|
| [`CONTEXT.md`](CONTEXT.md) | Vocabulario del dominio. Empieza por aquí |
| [`docs/adr/`](docs/adr/) | Decisiones de arquitectura y su porqué |
| [`docs/CONTRATO-DATOS.md`](docs/CONTRATO-DATOS.md) | Payload exacto del envío |
| [`docs/CONVENCION-ASSETS.md`](docs/CONVENCION-ASSETS.md) | Nombres y formatos de imágenes |
| [`PLAN-DESARROLLO-UX-2026.md`](PLAN-DESARROLLO-UX-2026.md) | Plan maestro y anexos: DDL, matrices de alimentos con pesos, textos literales |
| [`CONFIGURACION.md`](CONFIGURACION.md) | Configuración paso a paso |
| [`INICIALIZACION-BD.md`](INICIALIZACION-BD.md) | Migraciones y seeds |

## Datos científicos: dos avisos

- **Los pesos en gramos del catálogo no se muestran nunca en la interfaz.** El
  participante ve la unidad de display ("1 rebanada"); exponer los gramos sesgaría su
  decisión.
- **Los 34 pesos del Anexo B son datos de protocolo.** Un `30` escrito `300` no se
  nota en la UI e invalida el análisis en silencio. Cualquier cambio en
  `database/seeds/seed_catalogo_alimentos.sql` se coteja contra el anexo.

## Contribuir

Una rama por tarea, un PR por rama. **Ningún PR se mergea sin la aprobación explícita
de Daniel (DanCas03).** Ver [`CLAUDE.md`](CLAUDE.md).
