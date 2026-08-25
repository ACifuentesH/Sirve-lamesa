# Inicialización de la base de datos

El esquema vive en Supabase y se construye aplicando **migraciones en orden** y
después los **seeds**. No hay un script que borre y recree el esquema: el que existía
(`init-database.js`) se retiró en el issue #24 junto con el backend Express. Dejaba el
estudio en un estado peligroso — arrancaba borrando todas las tablas, y hoy hay
decisiones ya recogidas que se perderían.

## Antes de empezar

Comprueba que el ref del proyecto en `DATABASE_URL` es **el mismo** que el de
`SUPABASE_URL` en tu `.env`. Ya ocurrió una vez que el `.env` apuntaba a un proyecto
viejo: las migraciones se aplicaron ahí y la aplicación arrancó contra un esquema sin
ellas, que es un fallo silencioso y molesto de encontrar.

## Migraciones

En `database/migrations/`, por número ascendente. Son acumulativas: cada una asume las
anteriores.

| Migración | Qué hace |
|---|---|
| `000_esquema_base.sql` | **Crea el esquema base**: las once tablas del diagrama. Idempotente y no destructiva |
| `001_ampliar_campo_navegador.sql` | Amplía `navegador` para el user-agent completo |
| `002_anonimizar_participantes.sql` | Retira los campos que identificaban al participante |
| `003_personajes_retratos.sql` | Columnas de retrato en `personajes` |
| `004_pedro_imagen_pedro_png.sql` | Corrección puntual de un retrato antiguo |
| `005_perfil_sociodemografico.sql` | Perfil sociodemográfico del participante (A3) |
| `006_catalogo_y_conducta.sql` | `catalogo_alimentos`, secuencia de clics y tipos de alimento |
| `007_vista_respuestas_experimento.sql` | La vista que leen el panel y las exportaciones (ADR-0003) |
| `008_rpc_registrar_respuesta_experimento.sql` | La RPC transaccional del envío (ADR-0001) |
| `009_rls_endurecer_interim.sql` | Primer endurecimiento de RLS |
| `011_fijar_search_path_calcular_duracion.sql` | Fija el `search_path` de la función de duración |
| `012_rls_solo_rpc.sql` | La escritura del participante solo entra por la RPC |
| `013_investigadores_lista_blanca.sql` | Solo un investigador de la lista blanca lee el estudio |
| `014_retirar_politicas_auth_obsoletas.sql` | Retira políticas que quedaron sin uso |
| `015_rpc_pesos_autoritativos_y_notas.sql` | La RPC recalcula los pesos desde el catálogo y deja constancia; `envio_id` contra duplicados |
| `016_rls_cerrar_legado_y_verificar.sql` | Cierra las tablas del esquema antiguo conservando la RPC |
| `017_notas_decisiones_porcionamiento.sql` | Garantiza `Decisiones_porcionamiento.notas` en bases ya desplegadas |

> No existe una migración `010`: el número se saltó y no falta nada.

> Los ficheros sueltos de `database/` (`schema.sql`, `participantes.sql`,
> `sesiones_juego.sql`, `decisiones_porcionamiento.sql`) son el origen histórico del
> esquema y **ya no hay que aplicarlos**: su contenido vive ahora en la `000`, sin
> los `DROP TABLE` que traía `schema.sql`. Se conservan como referencia.

Aplícalas con el SQL editor del dashboard de Supabase, o con `psql`:

```bash
psql "$DATABASE_URL" -f database/migrations/000_esquema_base.sql
psql "$DATABASE_URL" -f database/migrations/001_ampliar_campo_navegador.sql
# ...y así en orden hasta la última
```

## Seeds

Después de las migraciones, en este orden:

```bash
psql "$DATABASE_URL" -f database/seeds/seed_personajes.sql
psql "$DATABASE_URL" -f database/seeds/seed_catalogo_alimentos.sql
```

Los dos son **idempotentes**: se pueden volver a ejecutar y actualizan en lugar de
duplicar. Y los dos se autocomprueban — terminan con un bloque que falla si los datos
no cuadran:

- `seed_personajes.sql` exige 8 personajes, 4 perfiles de edad × 2 géneros.
- `seed_catalogo_alimentos.sql` exige 11 / 12 / 11 alimentos y comprueba la suma de
  los pesos contra los totales del Anexo B.

Esa comprobación es deliberada: los pesos son datos de protocolo, un `30` escrito
`300` no se nota en la interfaz e invalida el análisis en silencio. Si alguien edita
un peso sin querer, la carga falla en lugar de pasar desapercibida.

**Los personajes viejos no se borran.** Hay decisiones ya grabadas que los referencian
por clave ajena. Se distinguen porque las filas nuevas son las únicas con `slug`, y es
por ahí por donde el simulador arma el pool.

## Comprobar que quedó bien

```sql
-- 8 personajes en el pool del estudio
SELECT COUNT(*) FROM personajes WHERE slug IS NOT NULL;

-- 11 / 12 / 11
SELECT momento_dia, COUNT(*) FROM catalogo_alimentos GROUP BY momento_dia;

-- La vista responde
SELECT COUNT(*) FROM respuestas_experimento;
```

## Problemas frecuentes

**`getaddrinfo ENOENT`**
La conexión directa `db.xxxxx.supabase.co` a veces solo resuelve por IPv6. Usa la
cadena del *session pooler*, que es IPv4. Ver `.env.example`.

**La conexión se queda colgada (504)**
Proyecto pausado, red, o `PG_CONNECTION_TIMEOUT_MS` demasiado corto.

**Una migración falla diciendo que el objeto ya existe**
Estaba aplicada. Las migraciones no llevan registro propio: apunta cuál fue la última
que corriste.

## Archivos relacionados

- `database/migrations/` — esquema, vista y RPC
- `database/seeds/` — 8 personajes y 34 alimentos
- `database-pool-config.js` — arma la configuración de `pg` desde `DATABASE_URL`
- `PLAN-DESARROLLO-UX-2026.md`, Anexo A — DDL de referencia; Anexo B — los 34 pesos
