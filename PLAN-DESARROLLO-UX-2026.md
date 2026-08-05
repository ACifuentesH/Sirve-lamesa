# Plan de Desarrollo — Adecuación a Especificaciones UI/UX (28 May 2026)

**Proyecto:** Sirve la Mesa — Simulador de Distribución de Porciones Alimentarias
**Documento fuente:** `Documento_Especificaciones_UX_28May2026.docx` (v1.0, Fundación Ayúdate)
**Estado del repo al momento de planear:** rama `main`, commit `5943e56`
**Modalidad:** dos vías de trabajo en paralelo, carga equilibrada

---

## 1. Cómo leer este documento

- **Sección 3** es lo que hay que decidir entre los dos **antes** de escribir código. Son tres decisiones que cambian el alcance.
- **Sección 4 (Fase 0)** es trabajo conjunto, en una sola sesión. Sin esto, las dos vías chocan.
- **Sección 5** es la Vía A, **Sección 6** es la Vía B. Cada tarea tiene criterios de aceptación verificables.
- **Sección 7** es la tabla de propiedad de archivos. Es la regla que evita conflictos de merge.
- **Anexos (Sección 11+)** tienen los datos exactos del documento: DDL, matrices de alimentos con pesos, textos literales de pantalla, prompts de IA. No hay que volver al `.docx`.

---

## 2. Diagnóstico: brecha entre el documento y el repositorio actual

El documento no es una lista de correcciones menores: **redefine la lógica, el diseño y la recolección de datos**. Esto es lo que hay hoy contra lo que se pide.

| # | Módulo del documento | Estado actual en el repo | Magnitud |
|---|---|---|---|
| 2 | Registro sociodemográfico (7 campos: peso, edad, estatura, género, nivel de estudios, etnia, región origen/residencia) | `LoginComponent` captura solo `nombres`, `edad`, `sexo` (radios M/F/otro). Faltan 6 campos y todos los desplegables. La BD tiene `peso_kg`/`altura_cm` pero no `nivel_estudios`, `etnia`, `region_*` | **Rehacer** |
| 3 | Onboarding obligatorio con botón bloqueado 5 s | **No existe** ninguna pantalla de instrucciones | **Nuevo** |
| 3 | Banner de contextualización dinámica fijo, 100% ancho, no cerrable, variables en negrita | Existe texto disperso: escenario en el header, nombre del personaje en el panel central. No hay banner unificado ni sticky | **Rehacer** |
| 4 | 8 personajes: Santi, Sofía, Mateo, Valeria, Carlos, Elena, Juan, María — fotos realistas IA, `.webp` 500×500 | Hay 8 filas en `Personajes` pero con nombres genéricos ("Niño (6-11 años)"), rangos de edad distintos, y **solo 3 PNG compartidos** (`niño.png`, `niño-comiendo.png`, `niño-cubierto-plato.png`) | **Rehacer** |
| 5.1 | Plato con 4 cuadrantes, reparto al cuadrante menos ocupado, fade-in, offset 15 px al apilar | `PlatoDropZoneComponent` usa espiral desde el centro + 150 intentos aleatorios con validación de radio. No hay cuadrantes ni offset determinista | **Rehacer** |
| 5.2 | 3 catálogos (Desayuno/Almuerzo/Cena) con 34 alimentos y pesos exactos en gramos, en 4 pestañas cada uno | `IngredientesComponent` muestra **todos** los ingredientes sin filtrar por escenario. Comentario en el código lo admite. Tabs fijas por categoría (proteína/carbo/vegetal/fruta), no por pestaña del documento | **Rehacer** |
| 5.3 | Controles `[+]` / `[-]`, máximo 4 porciones por alimento, `[-]` a cero borra del plato | **No existen.** Se usa `porcionDefault` fijo y sin límite | **Nuevo** |
| 5.4 | Validación de plato vacío con mensaje literal; bebida opcional registra 0 | No hay validación más allá de deshabilitar el botón si el plato está vacío | **Nuevo** |
| 6.1 | Modal de confirmación de dos pasos con textos literales | **No existe.** "Finalizar Plato" envía directo | **Nuevo** |
| 6.2 | Envío consolidado en un JSON, control de éxito/error, reintento sin perder datos | Flujo en 3 llamadas separadas (`/participantes` → `/sesiones` → `/decisiones`), sin manejo de fallo de red ni reintento | **Rehacer** |
| 6.3 | Pantalla de salida sostenida + botón de regreso a la web de la Fundación | Bloque `*ngIf="juegoCompletado"` que redirige solo a los 3 s. Es exactamente el "cierre abrupto" que el documento pide reemplazar | **Rehacer** |
| 7.1 | Registro obligatorio de `Secuencia_Clics` y `Tiempo_Decision_Segundos` | `componentes_servidos` (JSONB) y `tiempo_decision_ms` existen; **`Secuencia_Clics` no se captura** | **Nuevo** |
| 7.2 | Compilable para `<iframe>`, rutas relativas, assets en `/assets/characters/` y `/assets/foods/{momento}/` | Assets todos en `assets/images/ingredientes/` en PNG. Build sin `base-href` relativo | **Rehacer** |
| — | Tipografía sans-serif limpia (Roboto/Open Sans), fondo blanco/gris claro, estética institucional | Fuentes decorativas (`Watermelon`, `Rocket Raccoon`, `Gildsley`), escena de mesa/mantel/ventana. Estética de juego infantil, no de instrumento de investigación | **Rehacer** |

**Lectura honesta:** de 14 requisitos, 8 son reescrituras y 5 son módulos nuevos. Sobrevive la infraestructura (Express, PostgreSQL, patrón de servicios Angular, exportación CSV) pero casi toda la capa de UI y el modelo de datos del catálogo se rehacen.

### Deuda técnica que conviene limpiar de paso

Detectada durante el diagnóstico, barata de resolver mientras tocamos esos archivos:

- `@angular/cdk/drag-drop` está instalado e importado pero **no se usa** en ningún template; el drag es HTML5 nativo.
- `assets/images/ingredientes/ingredientes-data.json` (27 ingredientes) es código muerto: nada lo importa.
- Socket.IO está montado en `server.js` con dos eventos que **ningún cliente consume**.
- `database/migrations/001_ampliar_campo_navegador.sql` no lo ejecuta `init-database.js`, y es redundante.
- `registrarDecisionesBatch` abre `BEGIN`/`COMMIT` pero ejecuta con `this.pool` en vez de un `client` — la transacción no es real.
- `index.html` y `menu.html` en la raíz son legacy de AngularJS y no los sirve Express.
- Los `ON CONFLICT DO NOTHING` de `seed_data.sql` no tienen target `UNIQUE` (salvo `Menu`): al reejecutar, duplica filas.
- `public/game/index.html` referencia `docs/INTEGRACION_GODOT.md`, que no existe.
- `CONFIGURACION.md` está desactualizado: dice que el servidor crea las tablas al arrancar, lo cual ya no ocurre.

---

## 3. Tres decisiones a tomar antes de empezar

No avancen sin resolver esto. Cada una cambia el alcance de forma significativa.

### Decisión 1 — ¿Angular o React/Lovable?

El documento **instruye formalmente** usar Lovable u homólogos que generen React/TypeScript/Tailwind, y lo justifica por tiempos de entrega.

| Opción | A favor | En contra |
|---|---|---|
| **Mantener Angular 19** (recomendado) | Reutilizamos routing, servicios, guards, `ApiService`, backend Express y PostgreSQL completos. El build de Angular ya es 100% client-side y se incrusta en `<iframe>` sin problema, que es el **entregable real** que exige la §7.2 | Contradice la letra de la instrucción técnica |
| **Migrar a React + Tailwind + Supabase** | Cumple la instrucción al pie de la letra | Se descarta el backend Express y el esquema PostgreSQL que ya funcionan. Reescritura total, no ahorro de tiempo |

**Argumento para defender ante la Fundación:** la §7.2 define el entregable como *"código estándar, limpio y 100% descargable, listo para incrustar mediante `<iframe>`"*. Angular cumple los tres criterios. Lovable era el **medio** propuesto para llegar rápido; nosotros ya tenemos el 60% de la infraestructura hecha, así que el medio más rápido es el que ya está andando. Conviene dejar esto por escrito en un correo antes de codificar, para no discutirlo en la entrega.

Este plan está escrito asumiendo **Angular**. Si la Fundación insiste en React, la Fase 0 y el reparto de vías siguen siendo válidos; cambian los nombres de archivo.

### Decisión 2 — ¿Un personaje por participante, u ocho? (la más importante)

Hoy la app hace servir **8 platos seguidos** (uno por personaje). El documento apunta consistentemente a **un solo plato**:

- §3: *"deberás preparar **un plato** de comida para **un** usuario simulado"*
- §4.1: *"precargar y **aleatorizar** un catálogo equilibrado de 8 personajes"* → los 8 son el pool, no la secuencia
- §6.1: *"Una vez que envíes **la simulación**, tus respuestas se registrarán de forma definitiva"* → un único envío terminal
- §6.3: pantalla de salida inmediatamente después de ese envío

**Implicación metodológica:** con 1 personaje aleatorio pasamos a un diseño **entre-sujetos** (cada participante ve una sola condición). Con 8 es **intra-sujetos**. Son análisis estadísticos distintos y hace falta muchísima más muestra en el diseño entre-sujetos.

**Propuesta:** implementar `ASIGNACIONES_POR_PARTICIPANTE` como constante de configuración, con valor por defecto `1`. El bucle ya existe en `GameComponent`, así que soportar ambos casos cuesta casi nada y nos cubre si la Fundación cambia de opinión. **Hay que preguntarlo por escrito de todas formas**, porque afecta el cálculo de muestra del estudio.

### Decisión 3 — ¿Tabla `respuestas_experimento` o esquema normalizado?

La §7.2 pide insertar en *"una tabla llamada `respuestas_experimento`"*. Nuestro esquema está normalizado en `Participantes` / `Sesiones_juego` / `Decisiones_porcionamiento`.

**Propuesta:** las dos cosas, sin duplicar datos.
1. Mantener las tablas normalizadas como fuente de verdad.
2. Crear una **VISTA SQL** llamada `respuestas_experimento` que aplane todo en una fila por decisión.

Así la Fundación consulta y exporta exactamente el nombre que pidió, y nosotros conservamos integridad referencial. La vista es de lectura, así que no hay riesgo de desincronización.

---

## 4. Fase 0 — Trabajo conjunto (bloqueante, 1 sesión de ~4 h)

**Esto se hace juntos, en la misma llamada, y se mergea a `develop` antes de que cada uno abra su rama.** El objetivo es congelar todos los puntos de contacto para que después nadie toque los archivos del otro.

| # | Entregable | Archivo | Por qué es bloqueante |
|---|---|---|---|
| 0.1 | Confirmar las 3 decisiones de la Sección 3 y anotar la respuesta | `docs/DECISIONES.md` | Cambia el alcance de ambas vías |
| 0.2 | Interfaces TypeScript compartidas | `angular-app/src/app/models/*.ts` | A produce `Participante`, B consume `Personaje` y `AlimentoCatalogo`; ambos escriben `PayloadEnvio` |
| 0.3 | Contrato de datos: payload JSON exacto del envío final | `docs/CONTRATO-DATOS.md` | A implementa el receptor, B implementa el emisor. Si no coincide, nada funciona |
| 0.4 | Convención de rutas de assets y nombres de archivo | `docs/CONVENCION-ASSETS.md` | B genera los archivos, A los referencia en el seed y en el build |
| 0.5 | Design tokens y tipografía base (Roboto/Open Sans, paleta institucional, escala de espaciado) | `angular-app/src/styles/_tokens.scss` + `styles.scss` | Los dos escriben CSS. Sin tokens compartidos salen dos apps distintas |
| 0.6 | Crear **todas** las rutas de Angular con componentes stub vacíos | `app-routing.module.ts` | Se toca **una sola vez, juntos**. Después nadie lo edita: es el archivo con más riesgo de conflicto |
| 0.7 | Montar **todos** los routers de Express con handlers stub | `server.js` | Mismo motivo que 0.6 |
| 0.8 | Crear rama `develop` y proteger `main` | — | Ambas vías mergean a `develop`, nunca a `main` |

### 0.2 — Interfaces a definir

```typescript
// models/participante.model.ts
export type Genero = 'masculino' | 'femenino' | 'no_binario' | 'prefiero_no_decir';
export type NivelEstudios = 'pregrado_curso' | 'pregrado_completo' | 'posgrado' | 'otro';
export type Etnia = 'latino_hispano' | 'afrodescendiente' | 'indigena' | 'blanco' | 'otro';

export interface Participante {
  id?: number;
  edad: number;
  peso_kg: number;
  altura_cm: number;
  genero: Genero;
  nivel_estudios: NivelEstudios;
  semestre_o_anio: string | null;
  etnia: Etnia;
  region_origen: string;
  region_residencia: string;
  consentimiento_informado: boolean;
}

// models/personaje.model.ts
export type MomentoDia = 'desayuno' | 'almuerzo' | 'cena';
export type PerfilEdad = 'Niño' | 'Niña' | 'Joven' | 'Adulto' | 'Adulto Mayor';

export interface Personaje {
  id: number;
  slug: string;              // 'santi'
  nombre: string;            // 'Santi'
  perfil_edad: PerfilEdad;   // 'Niño'
  edad_rango: string;        // '7-9'
  genero: 'M' | 'F';
  imagen: string;            // 'assets/characters/santi.webp'
  pronombre: 'él' | 'ella';  // para el banner: "adecuadas para él/ella"
}

// models/catalogo.model.ts
export interface AlimentoCatalogo {
  id: number;
  slug: string;              // 'pan-tostado'
  nombre: string;            // 'Pan Tostado'
  momento_dia: MomentoDia;
  grupo: string;             // 'Carbohidratos y Acompañamientos'
  tipo: string;              // 'carbohidrato' — para agregados por categoría en el export
  unidad_display: string;    // '1 rebanada'
  peso_gramos: number;       // 30
  es_bebida: boolean;
  imagen: string;            // 'assets/foods/desayuno/pan-tostado.webp'
  orden: number;
}

// models/plato.model.ts — estado en vivo del plato
export type Cuadrante = 'SI' | 'SD' | 'II' | 'ID';

export interface ItemPlato {
  alimento_id: number;
  slug: string;
  porciones: number;          // 1..4
  peso_total_g: number;       // porciones * peso_gramos
  cuadrante: Cuadrante;
  offset_index: number;       // para el desplazamiento de 15 px al apilar
}

export interface EventoClic {
  timestamp_ms: number;       // relativo al inicio de la tarea
  alimento_slug: string;
  accion: 'agregar' | 'quitar' | 'cambio_pestana';
}
```

### 0.3 — Payload de envío (contrato exacto)

Este es el objeto único que la Vía B compila y la Vía A recibe en `POST /api/respuestas-experimento`.

```json
{
  "participante": {
    "edad": 21,
    "peso_kg": 68.5,
    "altura_cm": 172,
    "genero": "masculino",
    "nivel_estudios": "pregrado_curso",
    "semestre_o_anio": "5to semestre",
    "etnia": "latino_hispano",
    "region_origen": "Zulia",
    "region_residencia": "Distrito Capital",
    "consentimiento_informado": true
  },
  "sesion": {
    "dispositivo": "web",
    "navegador": "Mozilla/5.0 ...",
    "resolucion_pantalla": "1920x1080",
    "fecha_inicio": "2026-08-04T13:22:11.000Z"
  },
  "contexto_asignado": {
    "personaje_id": 8,
    "personaje_slug": "juan",
    "personaje_nombre": "Juan",
    "personaje_perfil_edad": "Adulto Mayor",
    "personaje_edad_rango": "70-75",
    "personaje_genero": "M",
    "momento_dia": "desayuno"
  },
  "conducta": {
    "tiempo_decision_segundos": 42.5,
    "secuencia_clics": [
      { "timestamp_ms": 1840,  "alimento_slug": "huevo",       "accion": "agregar" },
      { "timestamp_ms": 5120,  "alimento_slug": "pan-tostado", "accion": "agregar" },
      { "timestamp_ms": 7430,  "alimento_slug": "huevo",       "accion": "quitar"  },
      { "timestamp_ms": 11200, "alimento_slug": null,          "accion": "cambio_pestana", "pestana": "Bebidas" }
    ]
  },
  "resultado_plato": {
    "alimentos": [
      {
        "alimento_id": 5, "slug": "huevo", "nombre": "Huevo (Frito, Revuelto o Cocido)",
        "tipo": "proteina", "grupo": "Proteínas y Lácteos",
        "porciones": 1, "unidad_display": "1 unidad",
        "peso_unitario_g": 50, "peso_total_g": 50, "cuadrante": "SI"
      },
      {
        "alimento_id": 1, "slug": "pan-tostado", "nombre": "Pan Tostado",
        "tipo": "carbohidrato", "grupo": "Carbohidratos y Acompañamientos",
        "porciones": 2, "unidad_display": "1 rebanada",
        "peso_unitario_g": 30, "peso_total_g": 60, "cuadrante": "SD"
      }
    ],
    "bebida": {
      "alimento_id": 10, "slug": "cafe-leche", "nombre": "Taza de Café con Leche / Negro",
      "porciones": 1, "volumen_ml": 200
    },
    "total_plato_gramos": 110,
    "total_bebida_ml": 200
  }
}
```

**Reglas del contrato, no negociables:**
- Si no hay bebida, `"bebida": null` y `"total_bebida_ml": 0`. Nunca se omite la clave (§5.4).
- `total_plato_gramos` **excluye** la bebida. La bebida va aparte porque es contenedor externo (§5.2 pestaña 4).
- `tiempo_decision_segundos` es decimal con un decimal, medido desde que se monta la pantalla de servicio hasta el clic en "Sí, enviar porción".
- `secuencia_clics` va en orden cronológico ascendente. `alimento_slug` es `null` solo para `cambio_pestana`.
- La respuesta del backend es `{ "success": true, "participante_id": N, "sesion_id": N, "decision_id": N }` o HTTP 4xx/5xx con `{ "success": false, "error": "..." }`.

### 0.4 — Convención de assets

```
angular-app/src/assets/
├── characters/          # 8 archivos .webp, 500×500
│   ├── santi.webp    sofia.webp    mateo.webp    valeria.webp
│   └── carlos.webp   elena.webp    juan.webp     maria.webp
└── foods/
    ├── desayuno/        # 11 archivos, .webp, 256×256, fondo transparente
    ├── almuerzo/        # 12 archivos
    └── cena/            # 11 archivos
```

- Nombre de archivo = `slug` del alimento exactamente (ver Anexos B y C).
- Rutas **relativas** siempre (`assets/...`, nunca `/assets/...`), requisito de la §7.2 para que funcione dentro de un `<iframe>` en un subdirectorio.
- Durante el desarrollo se usan placeholders con el nombre final ya correcto. Reemplazar el binario después no requiere tocar código.

---

## 5. VÍA A — Datos, Flujo de Entrada y Cierre

**Alcance:** todo lo que rodea a la tarea. Registro del participante, onboarding, confirmación, envío, cierre, base de datos, exportación para investigadores y despliegue.
**Módulos del documento:** 2, 3 (onboarding), 6 completo, 7.1, 7.2 (despliegue).
**Carga estimada:** ~52 h.

### A1 · Migración del esquema de base de datos — 6 h

Ampliar `Participantes` y `Decisiones_porcionamiento`, y crear la tabla del catálogo nuevo más la vista `respuestas_experimento`.

- Crear `database/migrations/002_perfil_sociodemografico.sql`
- Crear `database/migrations/003_catalogo_y_conducta.sql`
- Crear `database/migrations/004_vista_respuestas_experimento.sql`
- Actualizar `init-database.js` para que ejecute la carpeta `migrations/` completa en orden alfabético (hoy ni la mira) y luego los seeds de `database/seeds/`
- Arreglar los `ON CONFLICT DO NOTHING` sin target del seed viejo, o marcar `seed_data.sql` como legacy y excluirlo

El DDL completo está en el **Anexo A**.

**Criterios de aceptación**
- `npm run init-db` corre de punta a punta sin errores en una BD vacía
- Correrlo dos veces seguidas **no** duplica filas en ninguna tabla
- `SELECT * FROM respuestas_experimento` devuelve una fila por decisión con las columnas del árbol de la §7.1
- Las columnas nuevas de `Participantes` son `NOT NULL` donde el documento las pide obligatorias

### A2 · Endpoint consolidado de envío — 6 h

Implementar `POST /api/respuestas-experimento` recibiendo el payload de la Fase 0.3 y escribiendo las 3 tablas en **una transacción real** (`client = await pool.connect()`, `BEGIN`/`COMMIT`/`ROLLBACK` con `client`, no con `pool` — es el bug que ya tiene `registrarDecisionesBatch`).

- Crear `controllers/respuestaExperimentoController.js`
- Crear `routes/respuestas.js`
- Validación de entrada campo por campo, devolviendo 400 con mensaje útil
- Recalcular `total_plato_gramos` **en el servidor** a partir de `porciones × peso_gramos` leídos de la BD. No confiar en el total que manda el cliente: es un instrumento de investigación
- Rechazar `porciones > 4` (límite de la §5.3) y plato vacío (§5.4)

**Criterios de aceptación**
- Un POST válido inserta exactamente 1 participante, 1 sesión y 1 decisión
- Si falla la inserción de la decisión, **no queda** participante huérfano (rollback verificado a mano)
- El total de gramos calculado por el servidor coincide con el del cliente; si no, se registra el del servidor y se deja nota en `notas`
- Un POST con `porciones: 5` devuelve 400

### A3 · Pantalla de registro sociodemográfico — 10 h

Reemplazar `LoginComponent` por `RegistroComponent` con los 7 bloques de la §2.

| Campo | Control | Validación |
|---|---|---|
| Edad | number | requerido, 16–99 |
| Peso (kg) | number | requerido, 30–250, 1 decimal |
| Estatura (cm) | number | requerido, 100–230 |
| Género | select | requerido — Masculino / Femenino / Otro o no binario / Prefiero no decirlo |
| Nivel de Estudios | select | requerido — Pregrado en curso / Pregrado completo / Posgrado / Otro |
| Semestre o año que cursa | select o text | requerido **solo si** nivel = `pregrado_curso` (validador condicional) |
| Autoidentificación Étnica | select | requerido — Latino o Hispano / Afrodescendiente / Indígena / Blanco / Otro |
| Región de origen | select | requerido |
| Región donde vive actualmente | select | requerido |

Notas de implementación:
- El documento **elimina la etiqueta "Sexo"** y la sustituye por "Género". No dejar rastro de "sexo" en la UI.
- `nombres` desaparece del formulario: la §6.3 promete datos *"anónimos"*. Capturar el nombre lo contradice. Conservar la columna en BD como nullable por compatibilidad, pero no pedirla. **Confirmar con la Fundación.**
- Región: lista de estados de Venezuela más "Otro país". Ponerla en una constante compartida (`shared/regiones.const.ts`), no inline en el template.
- El botón de continuar permanece deshabilitado mientras el formulario sea inválido, con mensajes de error por campo bajo cada control.

**Criterios de aceptación**
- No se puede avanzar con ningún campo obligatorio vacío o fuera de rango
- El campo de semestre aparece y se vuelve obligatorio solo al elegir "Pregrado en curso"
- Los datos quedan en memoria (servicio), **no** se envían todavía: el POST único ocurre al final (§6.2)
- Recargar la página en medio del formulario no rompe la app

### A4 · Pantalla de onboarding con bloqueo de 5 segundos — 4 h

Nuevo `OnboardingComponent` con el **texto literal** del Anexo D. No parafrasear: es material de un protocolo experimental y el documento lo entrega como "copiar y pegar".

- Fondo blanco o gris muy claro, tipografía sans-serif de los tokens de Fase 0
- Botón `INICIAR SIMULACIÓN` deshabilitado los primeros 5 s, con cuenta atrás visible para que el bloqueo no parezca un bug ("Disponible en 5 s…")
- Al habilitarse, navega a la pantalla de servicio

**Criterios de aceptación**
- El botón está inerte durante 5 s reales y no se puede disparar por Enter ni por clic
- El texto coincide carácter por carácter con el Anexo D
- El contador se limpia en `ngOnDestroy` (sin fugas de `setInterval`)

### A5 · Modal de confirmación de dos pasos — 4 h

`ConfirmacionModalComponent` reutilizable, disparado por la Vía B desde el botón "Finalizar Tarea".

- Título: `¿Deseas guardar y enviar esta porción?`
- Cuerpo: `Has configurado el plato para [Nombre_Personaje]. Una vez que envíes la simulación, tus respuestas se registrarán de forma definitiva y no podrás modificarlas.`
- Botón secundario, izquierda: `Volver a revisar` → cierra y permite seguir editando
- Botón principal, derecha, color destacado: `Sí, enviar porción` → dispara el envío
- Trampa de foco, cierre con `Esc` equivalente a "Volver a revisar", `role="dialog"` y `aria-modal`

**Interfaz con la Vía B** (acordar en Fase 0): el modal recibe `@Input() nombrePersonaje: string` y emite `@Output() confirmado` / `@Output() cancelado`. La Vía B solo lo instancia; no conoce su interior.

**Criterios de aceptación**
- "Volver a revisar" deja el plato intacto, sin perder porciones ni posiciones
- Durante el envío, `isSubmitting` deshabilita ambos botones y muestra spinner
- No se puede enviar dos veces por doble clic

### A6 · Pantalla de salida sostenida — 3 h

`SalidaComponent` con el texto literal del Anexo E. Reemplaza el auto-redirect de 3 s actual, que es justo lo que la §6.3 llama "cierre abrupto".

- Estática: **no** hay temporizador ni redirección automática
- Botón centrado `Regresar a la Web de la Fundación` → `window.location.href` a la URL de la Fundación, leída de `environment.urlFundacion` (no hardcodeada)
- Al montarse, desmonta el simulador y limpia el estado de sesión para que "atrás" no reabra el plato ya enviado

**Criterios de aceptación**
- La pantalla permanece indefinidamente hasta que el usuario actúe
- El botón atrás del navegador no devuelve al simulador con datos enviados
- La URL de la Fundación se cambia editando solo `environment.prod.ts`

### A7 · Manejo de errores de red y reintento — 5 h

La §6.2 lo exige explícitamente: *"si hay un fallo de red, el sistema no se cierra"*.

- Estados globales `isSubmitting` / `isSuccess` / `errorEnvio` en un `EnvioService`
- En fallo: banner `Error de conexión. Por favor, inténtalo de nuevo` con botón de reintento, **conservando el payload completo en memoria**
- Respaldo en `localStorage` del payload antes de intentar el POST; se borra solo tras un 200. Si el participante recarga tras un fallo, se ofrece reenviar
- Reintento con backoff (3 intentos: 1 s, 3 s, 7 s) antes de mostrar el error al usuario
- Timeout de 15 s por intento

**Criterios de aceptación**
- Con el backend apagado, el mensaje aparece y el plato sigue editable
- Al reencender el backend, el reintento tiene éxito y no duplica el registro
- Simular latencia de 20 s produce timeout con mensaje, no un colgado indefinido

### A8 · Exportación para investigadores y panel admin — 8 h

- Reescribir `generarCSV` sobre la vista `respuestas_experimento`, con las columnas nuevas: género, nivel de estudios, etnia, región de origen, región de residencia, perfil de edad del personaje, tiempo de decisión en **segundos**, total de gramos del plato, volumen de bebida en ml
- Añadir una columna `secuencia_clics_json` al export para el análisis de conducta de la §7.1
- Mantener UTF-8 con BOM (ya funciona bien en Excel)
- Actualizar `public/admin.html`: KPIs por perfil de edad y por género del personaje, y desglose cruzado género del participante × género del personaje, que es la hipótesis central del estudio
- Retirar del panel las métricas que quedan sin sentido con el modelo nuevo

**Criterios de aceptación**
- El CSV abre en Excel con acentos correctos y una fila por decisión
- Todas las variables del árbol de la §7.1 están presentes en el export
- El panel carga sin errores de consola con la BD vacía y con datos

### A9 · Portabilidad, build para iframe y despliegue — 6 h

- Build con `--base-href ./` y verificar que **todos** los assets resuelvan con rutas relativas
- Crear `docs/INTEGRACION-IFRAME.md` con el snippet exacto que la Fundación debe pegar en su web, incluyendo `allow`, dimensiones mínimas y comportamiento responsive
- Verificar el simulador embebido dentro de un `<iframe>` en una página de prueba local
- Revisar CORS: hoy `server.js` acepta **cualquier** origen (`callback(null, true)`). Restringir a la lista blanca real de la Fundación más localhost
- Configurar `.env.example` (hoy se referencia en la documentación pero no existe en el repo)
- Actualizar `CONFIGURACION.md`, que está desactualizado, y borrar el placeholder de Godot en `public/game/index.html`

**Criterios de aceptación**
- El bundle servido desde un subdirectorio arbitrario funciona sin ajustes
- Dentro del `<iframe>` el flujo completo pasa de registro a pantalla de salida
- Un origen no autorizado recibe error de CORS

---

## 6. VÍA B — Simulación, Plato Inteligente y Catálogo

**Alcance:** la pantalla de servicio completa. Personajes, banner de contexto, menú lateral dinámico, canvas del plato, controles de porción, bebida y validaciones.
**Módulos del documento:** 3 (banner), 4 completo, 5 completo, 5.4.
**Carga estimada:** ~53 h.

### B1 · Generación de los 8 personajes con IA — 6 h

Producir las 8 fotografías realistas de la matriz de estímulos de la §4.1, cumpliendo el estándar de consistencia visual de la §4.2. **Este es el activo con más riesgo metodológico del proyecto:** si las imágenes no son homogéneas, cualquier diferencia en los datos puede atribuirse al estilo de la foto y no a la variable del experimento.

| slug | Nombre | Perfil | Rango | Género |
|---|---|---|---|---|
| `santi` | Santi | Niño | 7-9 | M |
| `sofia` | Sofía | Niña | 7-9 | F |
| `mateo` | Mateo | Joven | 14-16 | M |
| `valeria` | Valeria | Joven | 14-16 | F |
| `carlos` | Carlos | Adulto | 30-40 | M |
| `elena` | Elena | Adulto | 30-40 | F |
| `juan` | Juan | Adulto Mayor | 70-75 | M |
| `maria` | María | Adulto Mayor | 70-75 | F |

Requisitos técnicos de la §4.2 y §4.4, todos verificables:
- Plano medio corto, del pecho hacia arriba, de frente o tres cuartos leve
- Fondo neutro liso, gris claro o azul pálido. **Prohibido** cualquier contexto que insinúe nivel socioeconómico
- Iluminación difusa de estudio, sin sombras dramáticas
- Expresión neutra o sonrisa muy leve
- Ropa casual básica de colores neutros, sin logos, joyas ni accesorios
- **Exactamente 500×500 px, `.webp` optimizado**

Prompts base en el **Anexo F**.

**Criterios de aceptación**
- Los 8 archivos existen en `assets/characters/` con el nombre exacto del slug
- Puestos en fila los 8, se perciben del mismo "set fotográfico": mismo encuadre, fondo y luz
- Un tercero ajeno al proyecto identifica correctamente el grupo de edad de los 8 sin ver la etiqueta (prueba rápida, 3 personas)
- Cada archivo pesa menos de 60 KB

### B2 · Catálogo de alimentos: datos y assets — 10 h

Cargar las 3 matrices con **34 alimentos** y sus pesos exactos, y producir sus imágenes.

- Escribir `database/seeds/seed_catalogo_alimentos.sql` (34 INSERT, datos completos en Anexos B y C)
- Escribir `database/seeds/seed_personajes.sql` (los 8 de B1, reemplazando el seed viejo)
- Generar los 34 `.webp` a 256×256 con fondo transparente, en las tres subcarpetas de `assets/foods/`
- Crear `controllers/catalogoController.js` y `routes/catalogo.js` con `GET /api/catalogo?momento=desayuno`

Cuidado con los pesos: son datos científicos y el documento los fija uno por uno. Un `30` escrito como `300` invalida el análisis y nadie lo va a notar en la UI. **Verificar los 34 valores contra el Anexo B dos veces.**

**Criterios de aceptación**
- `GET /api/catalogo?momento=desayuno` devuelve 11 alimentos; almuerzo 12; cena 11
- Cada alimento trae `grupo`, `unidad_display`, `peso_gramos` y `es_bebida` correctos
- Los 34 pesos coinciden con el Anexo B, revisado por la otra persona
- Ningún alimento apunta a una imagen inexistente

### B3 · Banner de contextualización dinámica — 4 h

`BannerContextoComponent` según la §3 y el bloque de cabecera.

Plantilla, del documento:
> `Asignación actual: Vas a servirle el/la [Momento_Dia] a [Nombre_Personaje] ([Perfil_Edad]). Por favor, selecciona y distribuye en el plato las porciones que consideres adecuadas para él/ella.`

- Las tres variables en **negrita**
- Concordancia correcta: `el desayuno`, `el almuerzo`, `la cena`; y `para él` / `para ella` según el género del personaje. Resolverlo con una función pura, no con concatenación ingenua
- Fijo arriba, 100% del ancho, `position: sticky; top: 0`, **no se mueve al hacer scroll**
- Fondo de información institucional, azul claro o recuadro con borde sutil
- **No cerrable ni minimizable**: no incluir botón de cerrar

**Criterios de aceptación**
- Con `cena` + `María` el texto dice "la cena" y "para ella"
- Con `desayuno` + `Juan` dice "el desayuno" y "para él"
- Al hacer scroll en el menú lateral el banner permanece visible
- No existe forma de ocultarlo desde la UI

### B4 · Columna de avatar del personaje — 3 h

Según la §4.4, el avatar va en la **columna izquierda**, junto al contenedor del plato, con nombre y etiqueta de edad debajo (por ejemplo `Juan - Adulto Mayor`), sincronizado con el banner.

- `AvatarPersonajeComponent`, imagen 500×500 mostrada a tamaño responsive
- Selección aleatoria del personaje del pool de 8, respetando la decisión 2 de la Sección 3
- `loading="eager"` y dimensiones explícitas para evitar salto de layout

**Criterios de aceptación**
- El nombre y perfil del avatar siempre coinciden con los del banner
- En viewport de 1366×768 el avatar y el plato caben sin scroll horizontal
- Recargar asigna un personaje distinto (verificar aleatoriedad en ~20 recargas)

### B5 · Menú lateral con pestañas dinámicas por momento del día — 8 h

`MenuLateralComponent` que renderiza **exclusivamente** el catálogo del `momento_dia` asignado (§5.2). Hoy el componente muestra todos los ingredientes sin filtrar; esto lo corrige.

- Recibe `@Input() momentoDia: MomentoDia` y consume `GET /api/catalogo?momento=`
- Agrupa por el campo `grupo` y genera las pestañas dinámicamente. **No hardcodear los nombres de las pestañas**: vienen del dato, y son distintos entre desayuno y cena
- La pestaña 4 es siempre Bebidas y su contenido va al contenedor externo, no al plato (§5.2)
- Cada ítem muestra imagen, nombre y `unidad_display`. **No mostrar los gramos**: son para la BD, y exponerlos sesga la decisión del participante
- Registrar `cambio_pestana` en la secuencia de clics (§7.1)

**Criterios de aceptación**
- Con `desayuno` las pestañas son las 4 del Anexo B; con `cena` son las 4 de cena, distintas
- Nunca aparece un alimento de otro momento del día
- Las rutas de imagen siguen `assets/foods/{momento}/{slug}.webp`
- El peso en gramos no aparece en ninguna parte de la UI

### B6 · Controles de porción con límite de 4 — 5 h

Contador flotante junto a cada alimento del menú lateral (§5.3).

- Botón `[+]`: añade una porción, **tope de 4**. Al llegar a 4 se deshabilita con tooltip explicando el límite
- Botón `[-]`: resta. **Al llegar a cero, la imagen desaparece de inmediato del canvas del plato**
- El contador solo aparece tras el primer clic en el alimento
- Cada `[+]` / `[-]` alimenta `secuencia_clics` con timestamp relativo

**Criterios de aceptación**
- No hay forma de superar 4 porciones de un mismo alimento, ni con clics rápidos repetidos
- Bajar a 0 elimina el alimento del plato en el mismo frame, sin dejar hueco visual
- La secuencia de clics refleja el orden exacto de las acciones, verificado contra un log manual

### B7 · Canvas del plato con 4 cuadrantes — 10 h

El corazón de la vía, y la corrección más señalada del documento (§5.1: *"la imagen se colocaba siempre en las mismas coordenadas del centro, ocultando los alimentos anteriores"*).

Hay que **reemplazar** el algoritmo actual de `PlatoDropZoneComponent` (espiral desde el centro más 150 intentos aleatorios) por reparto determinista en cuadrantes:

1. Dividir el círculo del plato en 4 cuadrantes: Superior Izquierdo, Superior Derecho, Inferior Izquierdo, Inferior Derecho
2. Al seleccionar un alimento, evaluar **qué cuadrante está libre o tiene menos elementos** y soltarlo ahí
3. Animación `fade-in` al aparecer
4. Porciones adicionales del **mismo** alimento se apilan al lado con **offset de 15 px**, emulando comida contigua en un plato real
5. Contener cada elemento dentro del radio del plato, sin desbordes

Notas:
- Mantener el mapa de tamaños visuales por alimento que ya existe: funciona bien
- Al eliminar un alimento, **no** reorganizar el resto: mover comida ya servida es desconcertante y podría alterar la percepción de cantidad
- Determinista significa reproducible: mismo orden de clics, misma disposición. Eso permite auditar sesiones

**Criterios de aceptación**
- Servir 4 alimentos distintos los coloca uno en cada cuadrante, sin solaparse
- Servir 4 porciones del mismo alimento produce 4 imágenes escalonadas a 15 px, no una encima de otra
- Con 8 alimentos y 4 porciones cada uno (caso extremo) nada sale del círculo ni tapa completamente a otro
- La misma secuencia de clics genera la misma disposición dos veces seguidas

### B8 · Contenedor externo de bebida — 4 h

La §5.2 pone las bebidas en pestaña 4 como *"Contenedor Externo"*: la bebida **no va dentro del plato**.

- `ContenedorBebidaComponent`: vaso o taza al lado del plato
- Una sola bebida a la vez; elegir otra reemplaza la anterior
- Sin bebida es válido y registra `0` (§5.4)
- Volumen tratado en ml, separado de los gramos del plato

**Criterios de aceptación**
- Ninguna bebida se renderiza dentro del círculo del plato
- Elegir una segunda bebida reemplaza la primera, no las suma
- Enviar sin bebida produce `"bebida": null` y `"total_bebida_ml": 0` en el payload
- El total de gramos del plato nunca incluye ml de bebida

### B9 · Validaciones del plato y compilación del payload — 6 h

- **Plato vacío** (§5.4): si se intenta finalizar sin alimentos, alerta con el texto literal `Por favor, sirve los alimentos en el plato antes de continuar`. El plato vacío **no** puede llegar al modal
- Cronómetro de decisión: desde el montaje de la pantalla de servicio hasta el clic en "Sí, enviar porción", en segundos con un decimal
- Compilar el `PayloadEnvio` completo del contrato 0.3 y entregarlo al `EnvioService` de la Vía A
- Instanciar el `ConfirmacionModalComponent` de la Vía A pasándole `nombrePersonaje`

**Criterios de aceptación**
- Finalizar con plato vacío muestra el mensaje exacto y **no** abre el modal
- Un plato con solo bebida y sin comida cuenta como vacío y se rechaza
- El payload generado valida contra el contrato 0.3, campo por campo
- El tiempo de decisión medido coincide con un cronómetro externo dentro de ±0,5 s

### B10 · Limpieza de assets y documentación del módulo — 3 h

- Retirar la escena decorativa incompatible con la estética institucional que pide el documento (`mesa.png`, `mantel.png`, `ventana.png`, `pizarra-corcho.png`, `tabla.png`) y las fuentes decorativas
- Borrar `assets/images/ingredientes/ingredientes-data.json`, que es código muerto
- Eliminar `@angular/cdk/drag-drop` si el mecanismo final es solo por clic, o usarlo de verdad si se conserva el drag. Hoy está importado sin usarse
- Actualizar `README-ANGULAR.md` con la arquitectura nueva de componentes

**Criterios de aceptación**
- `npm run build:angular` no emite warnings de assets no encontrados
- No quedan imports sin usar en los componentes tocados
- El bundle final es más pequeño que el actual

---

## 7. Propiedad de archivos (regla anti-conflictos)

**Regla única: nadie edita un archivo de la columna del otro.** Si necesitas un cambio ahí, lo pides por mensaje y lo hace su dueño. Esto es lo que permite trabajar en paralelo sin resolver merges todos los días.

### Backend

| Vía A (dueño) | Vía B (dueño) |
|---|---|
| `database/migrations/*.sql` | `database/seeds/seed_personajes.sql` |
| `init-database.js` | `database/seeds/seed_catalogo_alimentos.sql` |
| `controllers/respuestaExperimentoController.js` | `controllers/catalogoController.js` |
| `controllers/gameDataController.js` | `routes/catalogo.js` |
| `routes/respuestas.js` | `routes/personajes.js` |
| `routes/participantes.js`, `routes/sesiones.js` | |
| `public/admin.html` | |
| `.env.example`, `CONFIGURACION.md` | `README-ANGULAR.md` |

Nótese el reparto de `database/`: la Vía A es dueña del **DDL** (estructura), la Vía B de los **seeds** (contenido). Son archivos distintos, así que no chocan, y cada uno queda con la parte que le corresponde conceptualmente.

### Frontend

| Vía A (dueño) | Vía B (dueño) |
|---|---|
| `components/registro/` | `components/simulador/` |
| `components/onboarding/` | `components/banner-contexto/` |
| `components/confirmacion-modal/` | `components/avatar-personaje/` |
| `components/salida/` | `components/menu-lateral/` |
| `services/envio.service.ts` | `components/plato-canvas/` |
| `services/participante.service.ts` | `components/contenedor-bebida/` |
| `services/api.service.ts` | `services/simulador.service.ts` |
| `environments/*` | `assets/**` |
| | `shared/regiones.const.ts` *(lo crea A, lo lee B si hace falta)* |

### Congelados tras la Fase 0 — requieren acuerdo de los dos

- `angular-app/src/app/models/*.ts`
- `angular-app/src/app/app-routing.module.ts`
- `server.js`
- `angular-app/src/styles.scss` y `styles/_tokens.scss`
- `docs/CONTRATO-DATOS.md`

Si hay que tocarlos: mensaje al otro, cambio en un commit aparte y pequeño, merge a `develop` el mismo día. Nunca dentro de un PR grande de feature.

---

## 8. Cronograma y puntos de sincronización

Estimado sobre **3 semanas** con dedicación de proyecto de semestre.

| Semana | Vía A | Vía B | Sincronización |
|---|---|---|---|
| **0** (2 días) | Fase 0 conjunta | Fase 0 conjunta | **Hito 0:** decisiones cerradas, contrato y tokens en `develop` |
| **1** | A1 migración BD, A2 endpoint, A3 registro | B1 personajes IA, B2 catálogo y assets, B3 banner | **Hito 1** (fin de semana 1): la BD acepta el payload y el catálogo responde por momento del día. Prueba conjunta con `curl` |
| **2** | A4 onboarding, A5 modal, A6 salida, A7 errores | B4 avatar, B5 menú lateral, B6 porciones, B7 cuadrantes | **Hito 2** (fin de semana 2): flujo completo navegable de punta a punta, aunque el envío sea simulado |
| **3** | A8 export y admin, A9 iframe y despliegue | B8 bebida, B9 validaciones y payload, B10 limpieza | **Hito 3:** integración real, checklist de la Sección 10, prueba en `<iframe>` |

### Dependencias entre vías (los tres puntos donde uno espera al otro)

1. **B2 → A8.** La exportación necesita el catálogo cargado para probarse con datos reales. Mitigación: A8 se desarrolla contra 3 filas insertadas a mano; B2 llega en semana 1, mucho antes de que A8 empiece.
2. **A1 → B2.** Los seeds de B necesitan que exista la tabla `Catalogo_alimentos`. Mitigación: A1 es la primerísima tarea de la semana 1 y el DDL ya está escrito en el Anexo A, así que B puede escribir sus INSERT en paralelo sin esperar.
3. **A5 → B9.** B instancia el modal de A. Mitigación: en Fase 0 se acuerda la firma (`@Input nombrePersonaje`, `@Output confirmado/cancelado`) y B trabaja contra un stub hasta que A lo entregue en semana 2.

Ninguna dependencia bloquea más de un día si se respeta el orden. **Reunión de 15 minutos cada dos días** para detectar bloqueos temprano.

---

## 9. Estrategia de ramas y revisión

```
main                      ← solo releases, protegida, nadie commitea directo
└── develop               ← integración, aquí mergean las dos vías
    ├── via-a/01-migracion-bd
    ├── via-a/02-endpoint-envio
    ├── via-a/03-registro-sociodemografico
    ├── ...
    ├── via-b/01-personajes-ia
    ├── via-b/02-catalogo-alimentos
    ├── via-b/07-plato-cuadrantes
    └── ...
```

Reglas:
- **Una rama por tarea**, no una por vía. Ramas grandes y largas producen exactamente los conflictos que la Sección 7 intenta evitar.
- PR de la rama de tarea a `develop`. **El otro lo revisa antes del merge**, aunque sea una revisión rápida: sirve para que ambos conozcan todo el código, que es lo que se pide en un proyecto de dos.
- `git pull origin develop` **antes** de abrir cualquier PR.
- Commits en español, imperativo, con el prefijo de la tarea: `A3: agregar validador condicional de semestre`.
- Nada llega a `main` hasta pasar el checklist de la Sección 10 completo.

Revisión cruzada obligatoria en dos puntos, por riesgo:
- **Los 34 pesos en gramos del Anexo B** los verifica la Vía A contra el documento original. Un error aquí es invisible en la UI e invalida el estudio.
- **El payload de envío** lo verifica la Vía B contra el receptor de A, con un caso real de punta a punta.

---

## 10. Checklist de aceptación final contra el documento

Recorrer esto entero antes de entregar. Cada línea cita el módulo del documento que la exige.

**Módulo 2 — Registro**
- [ ] Peso, Edad y Estatura como campos validados
- [ ] La etiqueta dice "Género", no "Sexo", con las 4 opciones
- [ ] Nivel de Estudios con opciones universitarias, incluyendo año o semestre
- [ ] Autoidentificación Étnica con las 5 opciones estandarizadas
- [ ] Región de origen **y** región de residencia actual, ambas

**Módulo 3 — Onboarding y contexto**
- [ ] Pantalla de presentación que no revela el objetivo psicológico del estudio
- [ ] Texto de instrucciones idéntico al Anexo D
- [ ] Botón `INICIAR SIMULACIÓN` inactivo los primeros 5 segundos
- [ ] Tipografía sans-serif sobre fondo blanco o gris claro
- [ ] Banner de asignación fijo, 100% de ancho, variables en negrita, no cerrable

**Módulo 4 — Personajes**
- [ ] Los 8 personajes con los nombres exactos del documento
- [ ] Un representante masculino y uno femenino por cada categoría de edad
- [ ] Fotografías realistas, no dibujos vectoriales
- [ ] Encuadre, fondo, luz, expresión e indumentaria homogéneos en los 8
- [ ] `.webp` de exactamente 500×500 px
- [ ] Avatar en la columna izquierda con nombre y etiqueta de edad debajo

**Módulo 5 — Plato y catálogo**
- [ ] 4 cuadrantes con reparto al menos ocupado
- [ ] Animación fade-in al colocar
- [ ] Offset de 15 px al apilar porciones del mismo alimento
- [ ] Ningún alimento tapa a otro por completo
- [ ] Catálogo filtrado por momento del día, sin fugas entre matrices
- [ ] Los 34 alimentos con sus pesos exactos en BD
- [ ] Bebidas en contenedor externo, fuera del plato
- [ ] Controles `[+]` / `[-]` con tope de 4 porciones
- [ ] `[-]` a cero borra la imagen del canvas de inmediato
- [ ] Mensaje literal de plato vacío
- [ ] Bebida opcional que registra 0

**Módulo 6 — Cierre**
- [ ] "Finalizar Tarea" en la esquina inferior derecha
- [ ] Modal de confirmación con los textos literales y los dos botones correctos
- [ ] "Volver a revisar" preserva el plato intacto
- [ ] Envío como un único JSON estructurado
- [ ] Mensaje `Error de conexión. Por favor, inténtalo de nuevo` sin perder datos
- [ ] Pantalla de salida estática, sin cierre abrupto, texto del Anexo E
- [ ] Botón de regreso a la web de la Fundación

**Módulo 7 — Datos y despliegue**
- [ ] Todas las variables del árbol de la §7.1 quedan registradas
- [ ] `Secuencia_Clics` se captura y exporta
- [ ] `Tiempo_Decision_Segundos` en segundos con decimal
- [ ] `Total_Plato_Gramos` calculado en el servidor
- [ ] Tabla o vista `respuestas_experimento` disponible
- [ ] Rutas de assets relativas, verificado en subdirectorio
- [ ] Funciona embebido en `<iframe>`
- [ ] Código descargable, sin dependencias propietarias

---

# ANEXOS

Datos extraídos literalmente del documento de especificaciones. No hace falta volver al `.docx`.

---

## Anexo A — DDL propuesto (Vía A, tarea A1)

```sql
-- ============================================================
-- 002_perfil_sociodemografico.sql
-- Módulo 2 del documento: nuevas dimensiones sociodemográficas
-- ============================================================

ALTER TABLE Participantes
  ADD COLUMN IF NOT EXISTS genero            VARCHAR(30),
  ADD COLUMN IF NOT EXISTS nivel_estudios    VARCHAR(40),
  ADD COLUMN IF NOT EXISTS semestre_o_anio   VARCHAR(40),
  ADD COLUMN IF NOT EXISTS etnia             VARCHAR(40),
  ADD COLUMN IF NOT EXISTS region_origen     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS region_residencia VARCHAR(100);

ALTER TABLE Participantes
  ADD CONSTRAINT chk_genero CHECK (
    genero IN ('masculino','femenino','no_binario','prefiero_no_decir')
  ),
  ADD CONSTRAINT chk_nivel_estudios CHECK (
    nivel_estudios IN ('pregrado_curso','pregrado_completo','posgrado','otro')
  ),
  ADD CONSTRAINT chk_etnia CHECK (
    etnia IN ('latino_hispano','afrodescendiente','indigena','blanco','otro')
  );

-- 'nombres' pasa a ser opcional: la §6.3 promete datos anónimos
ALTER TABLE Participantes ALTER COLUMN nombres DROP NOT NULL;

-- La columna 'sexo' queda como legacy; el documento la sustituye por 'genero'
ALTER TABLE Participantes ALTER COLUMN sexo DROP NOT NULL;


-- ============================================================
-- 003_catalogo_y_conducta.sql
-- Módulo 5.2 (catálogo por momento del día) y 7.1 (conducta)
-- ============================================================

CREATE TABLE IF NOT EXISTS Catalogo_alimentos (
  PK_alimento     SERIAL PRIMARY KEY,
  slug            VARCHAR(60)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  momento_dia     VARCHAR(20)  NOT NULL
                  CHECK (momento_dia IN ('desayuno','almuerzo','cena')),
  grupo           VARCHAR(80)  NOT NULL,   -- nombre de la pestaña
  tipo            VARCHAR(40)  NOT NULL,   -- proteina | carbohidrato | vegetal | fruta | bebida | lacteo
  unidad_display  VARCHAR(80)  NOT NULL,   -- '1 rebanada'  (lo que ve el usuario)
  peso_gramos     INTEGER      NOT NULL,   -- 30           (lo que va a la BD)
  es_bebida       BOOLEAN      NOT NULL DEFAULT FALSE,
  imagen          VARCHAR(255) NOT NULL,
  orden           INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT uq_catalogo_slug_momento UNIQUE (slug, momento_dia)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_momento ON Catalogo_alimentos(momento_dia);

-- Personajes: alinear con la matriz de estímulos de la §4.1
ALTER TABLE Personajes
  ADD COLUMN IF NOT EXISTS slug        VARCHAR(40),
  ADD COLUMN IF NOT EXISTS perfil_edad VARCHAR(30),
  ADD COLUMN IF NOT EXISTS pronombre   VARCHAR(10);

ALTER TABLE Personajes ADD CONSTRAINT uq_personaje_slug UNIQUE (slug);

-- Conducta y resultado, según el árbol de la §7.1
ALTER TABLE Decisiones_porcionamiento
  ADD COLUMN IF NOT EXISTS FK_personaje              INTEGER REFERENCES Personajes(PK_personaje),
  ADD COLUMN IF NOT EXISTS personaje_perfil_edad     VARCHAR(30),
  ADD COLUMN IF NOT EXISTS secuencia_clics           JSONB,
  ADD COLUMN IF NOT EXISTS tiempo_decision_segundos  DECIMAL(8,1),
  ADD COLUMN IF NOT EXISTS total_bebida_ml           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bebida_slug               VARCHAR(60);

CREATE INDEX IF NOT EXISTS idx_decisiones_clics
  ON Decisiones_porcionamiento USING GIN (secuencia_clics);


-- ============================================================
-- 004_vista_respuestas_experimento.sql
-- Nombre exigido por la §7.2, sobre esquema normalizado
-- ============================================================

CREATE OR REPLACE VIEW respuestas_experimento AS
SELECT
  d.PK_decision                      AS decision_id,
  -- PARTICIPANTE
  p.PK_participante                  AS participante_id,
  p.edad                             AS participante_edad,
  p.peso_kg                          AS participante_peso_kg,
  p.altura_cm                        AS participante_altura_cm,
  p.imc                              AS participante_imc,
  p.genero                           AS participante_genero,
  p.nivel_estudios                   AS participante_nivel_estudios,
  p.semestre_o_anio                  AS participante_semestre,
  p.etnia                            AS participante_etnia,
  p.region_origen                    AS participante_region_origen,
  p.region_residencia                AS participante_region_residencia,
  -- CONTEXTO ASIGNADO
  d.FK_personaje                     AS personaje_id,
  d.personaje_tipo                   AS personaje_nombre,
  d.personaje_perfil_edad,
  d.personaje_edad_rango,
  d.personaje_sexo                   AS personaje_genero,
  d.escenario                        AS momento_dia,
  -- CONDUCTA
  d.tiempo_decision_segundos,
  d.secuencia_clics,
  -- RESULTADO DEL PLATO
  d.componentes_servidos,
  d.cantidad_total_gramos            AS total_plato_gramos,
  d.total_bebida_ml,
  d.bebida_slug,
  -- SESIÓN
  s.PK_sesion                        AS sesion_id,
  s.fecha_inicio,
  s.fecha_fin,
  s.duracion_total_segundos,
  s.estado                           AS sesion_estado,
  s.dispositivo,
  s.resolucion_pantalla,
  d.timestamp_decision
FROM Decisiones_porcionamiento d
JOIN Sesiones_juego  s ON s.PK_sesion       = d.FK_sesion
JOIN Participantes   p ON p.PK_participante = s.FK_participante
ORDER BY p.PK_participante, s.PK_sesion, d.orden_servicio;
```

---

## Anexo B — Matrices de alimentos (los 34, con pesos exactos)

**Advertencia:** `peso_gramos` es el valor que va a la base de datos y alimenta todo el análisis estadístico. `unidad_display` es lo único que ve el participante. **No mostrar nunca los gramos en la UI.**

### MATRIZ A — DESAYUNO (11 alimentos)

| # | slug | Nombre | Pestaña (grupo) | tipo | unidad_display | peso_gramos |
|---|---|---|---|---|---|---|
| 1 | `pan-tostado` | Pan Tostado | Carbohidratos y Acompañamientos | carbohidrato | 1 rebanada | **30** |
| 2 | `arepa-tortilla-maiz` | Arepa o Tortilla de Maíz | Carbohidratos y Acompañamientos | carbohidrato | 1 unidad mediana | **50** |
| 3 | `cereal-hojuelas` | Cereal de hojuelas | Carbohidratos y Acompañamientos | carbohidrato | 1 porción en tazón | **40** |
| 4 | `galletas-soda` | Galletas de soda/integrales | Carbohidratos y Acompañamientos | carbohidrato | 1 paquete (4 galletas) | **24** |
| 5 | `huevo` | Huevo (Frito, Revuelto o Cocido) | Proteínas y Lácteos | proteina | 1 unidad | **50** |
| 6 | `queso` | Queso Blanco / Amarillo | Proteínas y Lácteos | lacteo | 1 rebanada grosor medio | **30** |
| 7 | `jamon` | Jamón de Pavo / Cerdo | Proteínas y Lácteos | proteina | 1 rebanada delgada | **20** |
| 8 | `yogur` | Yogur Natural / Frutos Rojos | Proteínas y Lácteos | lacteo | 1 envase pequeño | **125** |
| 9 | `fruta-rodajas` | Fruta en rodajas (Manzana, Banano o Melón) | Frutas y Elementos Frescos | fruta | 1 porción | **40** |
| 10 | `cafe-leche` | Taza de Café con Leche / Negro | Bebidas | bebida | 1 taza | **200** (ml) |
| 11 | `jugo-naranja` | Vaso de Jugo de Naranja | Bebidas | bebida | 1 vaso | **250** (ml) |

### MATRIZ B — ALMUERZO (12 alimentos)

| # | slug | Nombre | Pestaña (grupo) | tipo | unidad_display | peso_gramos |
|---|---|---|---|---|---|---|
| 1 | `arroz` | Arroz Blanco o Integral | Carbohidratos y Acompañamientos | carbohidrato | 1 cucharada de servicio (cucharón) | **60** |
| 2 | `pasta` | Pasta / Espagueti | Carbohidratos y Acompañamientos | carbohidrato | 1 porción mediana de servicio | **70** |
| 3 | `papa` | Puré de Papa o Papas Cocidas | Carbohidratos y Acompañamientos | carbohidrato | 1 porción / 1 papa mediana | **80** |
| 4 | `platano-maduro` | Plátano Maduro (Horneado o Frito) | Carbohidratos y Acompañamientos | carbohidrato | 2 tajadas/rodajas | **40** |
| 5 | `pechuga-pollo` | Pechuga de Pollo a la plancha | Proteínas y Legumbres | proteina | 1 filete mediano | **120** |
| 6 | `carne-res` | Carne de Res molida o en bistec | Proteínas y Legumbres | proteina | 1 porción estándar | **120** |
| 7 | `pescado` | Filete de Pescado | Proteínas y Legumbres | proteina | 1 unidad regular | **110** |
| 8 | `granos-legumbres` | Granos / Legumbres (Frijoles, Lentejas o Garbanzos) | Proteínas y Legumbres | proteina | 1 cucharada de servicio | **50** |
| 9 | `ensalada-fresca` | Ensalada Fresca (Lechuga, Tomate, Pepino) | Vegetales y Ensaladas | vegetal | 1 porción abundante | **60** |
| 10 | `vegetales-vapor` | Vegetales al Vapor (Zanahoria, Brócoli, Calabacín) | Vegetales y Ensaladas | vegetal | 1 porción | **80** |
| 11 | `agua-mineral` | Vaso de Agua Mineral | Bebidas | bebida | 1 vaso | **250** (ml) |
| 12 | `te-jugo-natural` | Vaso de Té Frío o Jugo Natural | Bebidas | bebida | 1 vaso | **250** (ml) |

### MATRIZ C — CENA (11 alimentos)

| # | slug | Nombre | Pestaña (grupo) | tipo | unidad_display | peso_gramos |
|---|---|---|---|---|---|---|
| 1 | `pan-integral` | Pan Integral o Árabe | Carbohidratos Ligeros / Acompañamientos | carbohidrato | 1 rebanada / 1 unidad | **30** |
| 2 | `arepa-pequena` | Arepa Pequeña / Tortilla de Trigo | Carbohidratos Ligeros / Acompañamientos | carbohidrato | 1 unidad | **40** |
| 3 | `galletas-maiz-arroz` | Galletas Horneadas de Maíz / Arroz | Carbohidratos Ligeros / Acompañamientos | carbohidrato | 2 unidades | **20** |
| 4 | `pollo-desmechado` | Pechuga de Pollo desmechada | Proteínas Ligeras | proteina | 1 porción pequeña | **60** |
| 5 | `atun` | Atún en agua | Proteínas Ligeras | proteina | 1 porción (media lata) | **60** |
| 6 | `huevo-cocido` | Huevo Cocido / Pochado | Proteínas Ligeras | proteina | 1 unidad | **50** |
| 7 | `ricotta-cuajada` | Queso Ricotta / Cuajada ligera | Proteínas Ligeras | lacteo | 1 porción | **30** |
| 8 | `sopa-verduras` | Sopa / Crema de Verduras | Vegetales y Frutas | vegetal | 1 tazón mediano | **200** |
| 9 | `tomate-aguacate` | Rodajas de Tomate y Aguacate | Vegetales y Frutas | vegetal | 1 porción mixta | **50** |
| 10 | `infusion-te` | Taza de Infusión / Té Caliente (Aromática) | Bebidas | bebida | 1 taza | **200** (ml) |
| 11 | `leche-descremada` | Vaso de Leche descremada | Bebidas | bebida | 1 vaso | **200** (ml) |

**Totales de control:** desayuno 11 · almuerzo 12 · cena 11 · **34 filas**.

---

## Anexo C — Notas sobre el catálogo

- Varios alimentos aparecen en más de un momento del día con slug distinto porque cambia el peso o la preparación (`huevo` 50 g en desayuno contra `huevo-cocido` 50 g en cena; `pan-tostado` 30 g contra `pan-integral` 30 g). La restricción `UNIQUE (slug, momento_dia)` permite reusar un slug entre matrices si más adelante conviene, pero la carga inicial usa slugs distintos por claridad.
- La pestaña 4 se llama **Bebidas** en las tres matrices, pero los nombres de las pestañas 1, 2 y 3 **cambian entre desayuno y cena**. Por eso el `MenuLateralComponent` genera las pestañas desde el dato y no las hardcodea (tarea B5).
- El documento sugiere consultar una fuente de grupos alimenticios para la categorización. La columna `tipo` es la que alimenta los agregados por categoría del CSV, así que conviene mantenerla consistente con la clasificación clásica: proteína, carbohidrato, vegetal, fruta, lácteo, bebida.

---

## Anexo D — Texto literal del onboarding (Vía A, tarea A4)

> ### Estudio sobre Entornos Digitales y Decisiones Alimentarias Cotidianas
>
> Bienvenido/a a esta plataforma de simulación. Agradecemos enormemente tu participación en este estudio académico, cuyo objetivo es evaluar cómo las personas interactúan con interfaces digitales al tomar decisiones sobre el servicio y distribución de alimentos en el día a día.
>
> **¿En qué consiste la tarea?** A continuación, se te presentará un escenario interactivo en el que deberás preparar un plato de comida para un usuario simulado.
>
> Para realizar la tarea con éxito, por favor ten en cuenta las siguientes indicaciones:
>
> - **Lee el contexto:** En la parte superior de la pantalla aparecerá una solicitud específica. Allí se te indicará el nombre de la persona a la que debes servirle y el tipo de comida del día (por ejemplo: Desayuno, Almuerzo o Cena).
> - **Selecciona los alimentos:** Explora el catálogo de opciones disponibles en el menú lateral.
> - **Sirve las porciones:** Utiliza los controles de la interfaz para añadir y distribuir los alimentos en el plato en las cantidades que consideres adecuadas según el contexto provisto.
> - **Finaliza con seguridad:** Una vez que sientas que el plato está listo y equilibrado de acuerdo a tu criterio, presiona el botón "Finalizar Tarea" para registrar tus datos.
>
> Esta es una tarea de simulación basada en tu intuición y criterio cotidiano. No existen respuestas correctas o incorrectas. Te pedimos que actúes con la mayor naturalidad posible.
>
> `[ Botón: INICIAR SIMULACIÓN ]`

**Requisitos de diseño de esta pantalla, del documento:** fondo limpio blanco o gris claro; tipografía sans-serif de fácil lectura (Roboto u Open Sans); botón inactivo los primeros 5 segundos *"para forzar al participante a leer las instrucciones antes de avanzar"*.

---

## Anexo E — Texto literal de la pantalla de salida (Vía A, tarea A6)

> ### ¡Simulación Completada con Éxito!
>
> Desde la Fundación Ayúdate y el equipo de investigación, te agradecemos sinceramente el tiempo invertido en este estudio. Tu participación es de gran valor para ayudarnos a comprender mejor las decisiones alimentarias en entornos digitales.
>
> Los datos de tu sesión han sido registrados de forma segura y anónima.
>
> Ya puedes cerrar esta pestaña o presionar el botón de salida para regresar al portal principal de la Fundación.
>
> `[ Regresar a la Web de la Fundación ]`

El botón redirige a la página de inicio pública de la Fundación Ayúdate. **Pedir la URL definitiva**: el documento la deja incompleta (`https://www.fundacionayudate...`). Mientras llegue, va en `environment.urlFundacion`.

### Textos literales del modal de confirmación (tarea A5)

- **Título:** `¿Deseas guardar y enviar esta porción?`
- **Cuerpo:** `Has configurado el plato para [Nombre_Personaje]. Una vez que envíes la simulación, tus respuestas se registrarán de forma definitiva y no podrás modificarlas.`
- **Botón secundario (izquierda):** `Volver a revisar`
- **Botón principal (derecha, color destacado):** `Sí, enviar porción`

### Otros textos literales del sistema

- Plato vacío (§5.4): `Por favor, sirve los alimentos en el plato antes de continuar`
- Fallo de red (§6.2): `Error de conexión. Por favor, inténtalo de nuevo`
- Banner de contexto (§3): `Asignación actual: Vas a servirle el/la [Momento_Dia] a [Nombre_Personaje] ([Perfil_Edad]). Por favor, selecciona y distribuye en el plato las porciones que consideres adecuadas para él/ella.`
- Etiqueta del avatar (§4.4): `[Nombre_Personaje] - [Perfil_Edad]`, por ejemplo `Juan - Adulto Mayor`

---

## Anexo F — Prompts de IA para los personajes (Vía B, tarea B1)

**Prompt base del documento:**

```
Studio portrait of a [RANGO DE EDAD] [GÉNERO] [ETNIA/RASGOS], looking at the camera,
neutral pleasant expression, wearing a basic solid-colored t-shirt, solid light gray
background, soft studio lighting, photorealistic, 8k resolution, cinematic composition,
shot on 85mm lens --ar 1:1
```

**Ejemplo del documento (Juan):**

```
Studio portrait of a 72-year-old Hispanic grandfather, looking at the camera, short gray
hair, realistic wrinkles, neutral pleasant smile, wearing a basic navy blue polo shirt,
solid light gray background, soft studio lighting, photorealistic --ar 1:1
```

**Los 8 prompts derivados.** Manteniendo idénticos fondo, luz, encuadre y lente para no introducir variación de estilo entre condiciones:

| slug | Prompt |
|---|---|
| `santi` | `Studio portrait of an 8-year-old Hispanic boy, looking at the camera, short dark hair, neutral pleasant expression, wearing a plain light blue school t-shirt, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |
| `sofia` | `Studio portrait of an 8-year-old Hispanic girl, looking at the camera, dark hair, neutral pleasant expression, wearing a plain pink t-shirt, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |
| `mateo` | `Studio portrait of a 15-year-old Hispanic teenage boy, looking at the camera, short dark hair, neutral pleasant expression, wearing a plain gray t-shirt, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |
| `valeria` | `Studio portrait of a 15-year-old Hispanic teenage girl, looking at the camera, long dark hair, neutral pleasant expression, wearing a plain white t-shirt, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |
| `carlos` | `Studio portrait of a 35-year-old Hispanic man, looking at the camera, short dark hair, neutral pleasant expression, wearing a plain olive green t-shirt, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |
| `elena` | `Studio portrait of a 35-year-old Hispanic woman, looking at the camera, shoulder-length dark hair, neutral pleasant expression, wearing a plain beige t-shirt, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |
| `juan` | `Studio portrait of a 72-year-old Hispanic grandfather, looking at the camera, short gray hair, realistic wrinkles, neutral pleasant smile, wearing a basic navy blue polo shirt, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |
| `maria` | `Studio portrait of a 72-year-old Hispanic grandmother, looking at the camera, short gray hair, realistic wrinkles, neutral pleasant smile, wearing a plain lavender blouse, solid light gray background, soft studio lighting, photorealistic, shot on 85mm lens --ar 1:1` |

Postprocesado obligatorio: recortar a **500×500** exactos y convertir a `.webp` (calidad 82 suele quedar por debajo de 60 KB sin pérdida visible).

**Control de sesgo, no omitir:** el color de la camiseta varía entre personajes solo para que no parezcan clones. Si sospechan que el color influye (por ejemplo rosa para la niña y azul para el niño refuerzan estereotipo de género), unifiquen **todos** en gris o blanco. Es más defendible metodológicamente y el documento pide justamente *"ropa casual básica y de colores neutros"*.

---

## Anexo G — Preguntas abiertas para la Fundación

Enviar como un solo correo antes de empezar a codificar. Cada una bloquea o puede invalidar trabajo.

1. **¿Un personaje por participante u ocho?** (Decisión 2). Cambia el diseño experimental de intra-sujetos a entre-sujetos y con ello el tamaño de muestra necesario. Es la pregunta más importante de la lista.
2. **¿Se conserva la captura del nombre del participante?** La §6.3 promete datos anónimos, lo que contradice pedir el nombre. Hoy el sistema lo pide.
3. **URL definitiva de la Fundación** para el botón de salida. En el documento aparece truncada.
4. **¿Se mantiene el instrumento EAT-26?** Está en la BD actual y el nuevo documento no lo menciona en ningún módulo. Si sigue vigente, hace falta una pantalla más y hay que replanificar.
5. **Angular contra React/Lovable** (Decisión 1). Confirmar por escrito que el entregable en Angular satisface el requisito de código descargable e incrustable en `<iframe>`.
6. **Regiones geográficas:** ¿lista de estados de Venezuela, o hay que cubrir otros países? El documento dice "Estado o Región" sin especificar el país.
7. **¿Se registran las bebidas como variable de análisis** o solo como elemento de realismo de la escena? Afecta lo que se prioriza en la exportación.
8. **Nivel de estudios:** el documento pide "año o semestre que cursa" dentro del mismo campo. ¿Un solo campo combinado o dos separados? Este plan asume dos, con el segundo condicional.

---

## Resumen de carga de trabajo

| Vía | Tareas | Horas | Peso principal |
|---|---|---|---|
| **Fase 0** (conjunta) | 8 entregables | ~4 h cada uno | Contrato, modelos, tokens, rutas |
| **Vía A** | A1–A9 | ~52 h | Base de datos, formularios, flujo de envío, exportación, despliegue |
| **Vía B** | B1–B10 | ~53 h | Assets IA, catálogo, plato de cuadrantes, menú dinámico, porciones |

El reparto queda equilibrado en horas y también en tipo de dificultad: la Vía A concentra el riesgo de **integridad de datos** (transacciones, migraciones, exportación científica), la Vía B el riesgo de **lógica visual y de interacción** (algoritmo de cuadrantes, homogeneidad de estímulos). Ninguna de las dos es "la fácil".

**Tarea más riesgosa de cada vía**, a la que conviene darle margen extra: **A2** (transacción real con rollback, hoy mal implementada en el repo) y **B7** (algoritmo de cuadrantes, la corrección más visible que pidió la Fundación).
