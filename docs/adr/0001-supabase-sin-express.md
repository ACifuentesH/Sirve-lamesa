# Supabase sin Express: el envío consolidado es una función RPC de Postgres

El plan de adecuación UX (28 May 2026) fue escrito asumiendo el backend Express + PostgreSQL, pero el frontend activo ya consultaba Supabase directamente desde mayo de 2026, dejando dos caminos de datos paralelos. Decidimos consolidar en **Supabase sin Express**: el envío único del experimento se implementa como una función Postgres (`registrar_respuesta_experimento`) llamada por RPC, que da transacción real, recálculo de gramos en el servidor y validación (tope de 4 porciones, plato vacío) sin hostear Node; el entregable queda como build estático + Supabase, que encaja con el requisito de incrustación en `<iframe>` de la §7.2.

## Consecuencias

- Express, sus rutas/controladores, Socket.IO y el panel `public/admin.html` se retiran (issue #24); el historial de git los conserva.
- La seguridad pasa a depender de RLS: el rol `anon` solo puede ejecutar la RPC, y la lectura de datos exige Supabase Auth de investigadores (issue #7). El RLS abierto a `anon` que existía antes de esta decisión queda explícitamente prohibido.

## Opciones consideradas

Volver a Express como dicta el plan (descartado: implica deshacer la migración ya hecha y mantener un servidor vivo para la Fundación) y mantener ambos caminos (descartado: la duplicación ya produjo divergencia, p. ej. la exportación implementada dos veces).
