# Sirve la Mesa — aplicación Angular

La SPA del instrumento. Habla directamente con Supabase: no hay backend propio ni
proxy. Para la arquitectura y el dominio, ver [`../README.md`](../README.md) y
[`../CONTEXT.md`](../CONTEXT.md).

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200
```

`start` y `build` ejecutan antes `npm run config`, que genera
`src/environments/environment.ts` y `environment.prod.ts` a partir del `.env` de la
raíz del repositorio (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `URL_FUNDACION`).

Esos dos archivos **están fuera de git y no se editan a mano**: los reescribe el
script en cada arranque. Si te faltan credenciales, el script avisa por consola y
genera los environments vacíos.

## Build de producción

```bash
npm run build:prod
```

Sale en `dist/sirve-la-mesa/`.

## Estructura

```
src/app/
├── components/
│   ├── registro/                # alta anónima del participante
│   ├── onboarding/              # instrucciones, botón bloqueado 5 s
│   ├── simulador/               # la tarea de servicio
│   │   ├── banner-contexto/     #   asignación, con concordancia gramatical
│   │   ├── avatar-personaje/    #   retrato del personaje asignado
│   │   ├── menu-lateral/        #   catálogo del momento, en pestañas del dato
│   │   ├── plato-canvas/        #   reparto determinista en 4 cuadrantes
│   │   └── contenedor-bebida/   #   la bebida, siempre fuera del plato
│   ├── confirmacion-modal/      # confirmación de dos pasos
│   ├── salida/                  # cierre sostenido
│   ├── acceso-investigadores/   # sesión del investigador
│   └── investigador/            # panel de análisis y exportación
├── services/                    # Supabase, catálogo, asignación, plato, envío
├── models/contrato/             # contrato de datos congelado (Fase 0)
├── guards/                      # investigadorGuard
└── utils/                       # cuadrantes, texto del banner, exportación

src/assets/
├── characters/                  # los 8 retratos del estudio (.webp 500×500)
├── foods/                       # catálogo (.webp 256×256, fondo transparente)
└── images/ingredientes/         # PNG de la escena vieja, aún sin retirar
```

## Dos reglas que no se saltan

- **Los gramos no se muestran nunca.** El participante ve la unidad de display
  ("1 rebanada"). Exponer el peso sesgaría su decisión, y es el dato que sostiene todo
  el análisis.
- **`models/contrato/` está congelado.** Se acordó en la Fase 0 entre las dos vías;
  cambiarlo requiere acuerdo, no un commit suelto.

## Notas

- Las 34 fotografías del catálogo están en `assets/foods/{momento}/{slug}.webp`
  (issue #15). Ver `src/assets/foods/README.md`.
- `assets/images/ingredientes/` son los PNG del juego anterior. Se conservan a
  propósito; el simulador nuevo no los usa.
