---
name: ejecutando-tickets-sin-pausas
description: Use when the user asks to implement tracker tickets autonomously — "toma los tickets y velos implementando", "de manera automática", "sin pausas", "todas las preguntas al principio", "solo revisión al final" — in a repo with a GitHub issue tracker and blocking edges (e.g. Sirve-lamesa).
---

# Ejecutando tickets sin pausas

## Overview

Filosofía: **decisiones del usuario al inicio, ejecución continua, revisión humana al final.** El agente no decide por el usuario ni lo interrumpe: anticipa las decisiones y las pregunta todas juntas; todo bloqueo posterior se convierte en una nota del reporte final, nunca en una pausa.

## Prerrequisitos

- Tracker configurado (`/setup-matt-pocock-skills`); tickets creados con `/to-tickets`; decisiones de plan cerradas con `/grilling` + `/domain-modeling`.
- Leer `CLAUDE.md` y `CONTEXT.md` del repo antes de empezar; los ADRs de `docs/adr/` mandan sobre cualquier intuición.

## El ciclo (por tanda de tickets)

1. **Alcance**: los tickets que el usuario nombró, en orden del frontier (bloqueadores cerrados primero). Asignarse cada uno: `gh issue edit N --add-assignee @me`.
2. **Hechos vs decisiones**: los hechos se verifican en el repo (.env, esquema, código) — nunca se preguntan. Las decisiones genuinas del usuario se juntan TODAS en UN solo AskUserQuestion al inicio, cada una con la opción recomendada primero.
3. **Por ticket**: rama propia desde `develop` (`via-a/NN-slug`, `via-b/NN-slug`, `fase-0/...`) → implementar → **verificar con evidencia** (build de producción, script ejecutado con salida real) antes de afirmar éxito → commit en español imperativo con prefijo de tarea (`A3: agregar validador…`) + la línea Co-Authored-By del harness → push → **PR normal (no draft) contra `develop`**, con qué implementa, decisiones aplicadas y verificación en el cuerpo.
4. **PROHIBIDO mergear.** El PR queda abierto; solo Daniel mergea. Cuando él avise del merge: cerrar el issue con comentario enlazando el PR y sincronizar `develop` local.
5. **Bloqueo externo** (credencial, dato que solo el usuario sabe, respuesta de terceros): aislarlo en un único punto (constante/environment con placeholder + nota en el PR), etiquetar `needs-info` si aplica, y **seguir con el siguiente ticket**. La pregunta va una sola vez, en el reporte final. Jamás inventar el dato ni detener la tanda.
6. **Dominio**: decisión difícil de revertir + sorprendente sin contexto + trade-off real → ADR nuevo en `docs/adr/`; término nuevo → `CONTEXT.md`.
7. **Reporte final** (una sola entrega al terminar la tanda): tabla PR ↔ ticket ↔ verificación, frontier que quedó desbloqueado, y la lista corta de lo que solo el usuario puede resolver (merges, credenciales, respuestas pendientes).

## Red flags

| Tentación | Realidad |
|---|---|
| "El PR es trivial, lo mergeo y le ahorro tiempo" | El merge ES la revisión que pidió. Nunca. (Regla en CLAUDE.md.) |
| "Estoy bloqueado, mejor le pregunto ya" | Aísla el bloqueo y sigue con otro ticket; la pregunta va al final. |
| "Marco el PR como draft/[WIP] por seguridad" | PR normal y completo: la protección es la regla de no-merge, no el estado draft. |
| "Agrego tests/infra que nadie pidió" | La verificación pactada es el build de producción; no expandas el alcance. |

## Contexto Sirve-lamesa

Instrumento de investigación en psicología alimentaria (no una app de restaurante) — leer `CONTEXT.md`. Repo `ACifuentesH/Sirve-lamesa`; integración en `develop`; labels `via-a`/`via-b`/`fase-0` + triage (`ready-for-agent`, `needs-info`). Plan maestro: `PLAN-DESARROLLO-UX-2026.md` (anexos con DDL, textos literales que se copian carácter por carácter, y matrices de alimentos con pesos científicos). ADR-0001: Supabase sin Express — envío por RPC `registrar_respuesta_experimento`; ADR-0002: Angular; ADR-0003: `respuestas_experimento` es vista. Build check: `cd angular-app && npx ng build`. Migraciones: script node+pg con el `DATABASE_URL` del `.env` — verificar que el ref del proyecto coincida con `environment.ts` (hubo un `.env` apuntando a un proyecto viejo).
