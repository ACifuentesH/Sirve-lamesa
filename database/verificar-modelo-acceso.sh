#!/usr/bin/env bash
# =============================================================================
# Verificación empírica del modelo de acceso del issue #7
# =============================================================================
#
# Qué es esto y por qué existe
# ----------------------------
# La migración 016 comprueba los privilegios DESDE DENTRO de la base
# (has_table_privilege, sección 3) y deja la comprobación desde fuera como un
# bloque de comentarios sin ejecutar (016:289-318). Pero el criterio 1 del issue
# #7 pide otra cosa: «verificado con llamadas directas», es decir, qué contesta
# de verdad la Data API a alguien que solo tiene la clave anónima. Eso no se
# puede afirmar leyendo SQL — hay que preguntárselo al proyecto.
#
# Este script es esa pregunta, en forma ejecutable. Ningún agente puede correrlo
# (tienen prohibido tocar la base), así que lo ejecuta una persona del equipo y
# el resultado es la evidencia que cierra —o no— el criterio 1.
#
# NO ESCRIBE NADA EN LA BASE. Ver «Por qué esto no puede insertar» más abajo.
#
# Uso
# ---
#   export SUPABASE_URL="https://<ref>.supabase.co"     # Settings -> Data API
#   export SUPABASE_ANON_KEY="<clave publicable / anon>"
#   bash database/verificar-modelo-acceso.sh
#
# Si existe un `.env` en la raíz del repositorio, se leen de ahí y no hace falta
# exportar nada.
#
# Para verificar además el acceso del investigador (criterio 3, mitad «carga con
# ella»), añade las credenciales de UNA cuenta real del estudio. No están en el
# repositorio a propósito: los correos de los investigadores los tiene el equipo
# (issue #1) y la lista blanca de la migración 016 sigue con PLACEHOLDER.
#
#   export INVESTIGADOR_EMAIL="..."
#   export INVESTIGADOR_PASSWORD="..."
#
# Salida y código de retorno
# --------------------------
#   0  todas las comprobaciones obligatorias pasan
#   1  alguna falla  -> hay un hueco real de seguridad o el envío está roto
#   2  falta configuración (URL o clave)
#
# Por qué esto no puede insertar
# ------------------------------
# Son dos las llamadas que no son lecturas, y ninguna de las dos puede escribir:
#
#   * La sonda de la RPC manda `{"payload": {}}`. La función aborta en su
#     primera validación —«falta la seccion "participante"»— antes de mirar
#     nada y muchísimo antes del primer INSERT (015:179-181 frente a 015:546).
#     Y aunque no abortara ahí, una función plpgsql es una sola sentencia: un
#     RAISE deshace todo.
#   * Las sondas de escritura mandan un cuerpo con una columna inexistente
#     (`__sonda_no_existe__`). Si el rol tiene privilegio, PostgREST responde
#     400 PGRST204 quejándose de la columna; si no lo tiene, responde 401/404.
#     En ninguno de los dos casos llega a construirse una fila.
#
# Qué NO demuestra este script
# ----------------------------
#   * Nada sobre el rol `service_role`: esa clave no debe salir del servidor y
#     aquí no se usa.
#   * Nada sobre quién puede registrarse en Supabase Auth. El registro público
#     sigue abierto por defecto (013:4-6); lo que impide leer el estudio a una
#     cuenta recién creada es la lista blanca, y eso se comprueba en el bloque
#     del investigador, no aquí.
#   * Nada sobre la capa de GRANT del rol `authenticated` sobre `personajes` y
#     `catalogo_alimentos`, que ninguna migración revoca. Hoy solo lo tapa el
#     RLS. Ver la nota del PR de #7 sobre la migración 019 propuesta.
# =============================================================================

set -u

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
if [ -f "$RAIZ/.env" ]; then
  # shellcheck disable=SC1091
  set -a; . "$RAIZ/.env"; set +a
fi

URL="${SUPABASE_URL:-}"
KEY="${SUPABASE_ANON_KEY:-}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "FALTA CONFIGURACIÓN: define SUPABASE_URL y SUPABASE_ANON_KEY" >&2
  echo "(o deja un .env en la raíz del repositorio con esas dos variables)" >&2
  exit 2
fi

URL="${URL%/}"

if ! command -v curl >/dev/null 2>&1; then
  echo "FALTA curl: este script lo necesita." >&2
  exit 2
fi

fallos=0
avisos=0

ok()    { printf '  OK     %s\n' "$1"; }
falla() { printf '  FALLA  %s\n' "$1"; fallos=$((fallos + 1)); }
aviso() { printf '  AVISO  %s\n' "$1"; avisos=$((avisos + 1)); }

# Devuelve "<codigo>|<cuerpo recortado>" de una petición.
peticion() {
  local metodo="$1" ruta="$2" cuerpo="${3:-}" auth="${4:-$KEY}"
  local respuesta codigo salida

  if [ -n "$cuerpo" ]; then
    respuesta=$(curl -s -w $'\n%{http_code}' -X "$metodo" "$URL$ruta" \
      -H "apikey: $KEY" -H "Authorization: Bearer $auth" \
      -H "Content-Type: application/json" -d "$cuerpo" 2>/dev/null)
  else
    respuesta=$(curl -s -w $'\n%{http_code}' -X "$metodo" "$URL$ruta" \
      -H "apikey: $KEY" -H "Authorization: Bearer $auth" 2>/dev/null)
  fi

  codigo=$(printf '%s' "$respuesta" | tail -n 1)
  salida=$(printf '%s' "$respuesta" | sed '$d' | tr -d '\n' | cut -c1-200)
  printf '%s|%s' "$codigo" "$salida"
}

echo
echo "Proyecto: $URL"
echo "Clave:    ${KEY:0:12}… (publicable / anon)"
echo

# ---------------------------------------------------------------------------
# 0. La clave sirve para algo
#
# Si la clave está rotada o mal copiada, TODO responde 401 y el script parecería
# aprobar el criterio 1 sin haber probado nada. Esta comprobación existe para que
# eso no pueda pasar: `personajes` tiene que contestar 200.
# ---------------------------------------------------------------------------
echo "[0] La clave anónima es válida (si no, el resto del script no demuestra nada)"
r=$(peticion GET "/rest/v1/personajes?select=pk_personaje&limit=1")
c="${r%%|*}"
case "$c" in
  200) ok "la clave responde 200 en /rest/v1/personajes" ;;
  401|403)
    falla "la clave anónima devuelve $c: está rotada, caducada o mal copiada."
    echo
    echo "  Sin una clave válida NINGUNA de las comprobaciones de abajo prueba nada:"
    echo "  un 401 generalizado es indistinguible de un modelo de acceso correcto."
    echo "  Consigue la clave vigente en Settings -> Data API y vuelve a ejecutar."
    exit 1
    ;;
  *) falla "respuesta inesperada ($c) al probar la clave: ${r#*|}" ;;
esac
echo

# ---------------------------------------------------------------------------
# 1. CRITERIO 1 — con la clave anónima sola no se lee ninguna tabla ni la vista
#
# Un 200 con `[]` NO vale y se cuenta como fallo: significa que la relación sigue
# siendo legible y que lo único que la tapa es estar vacía. El día que entre la
# primera respuesta, se publica.
# ---------------------------------------------------------------------------
echo "[1] Criterio 1 — anon no lee las relaciones del estudio"
for t in participantes sesiones_juego decisiones_porcionamiento \
         investigadores respuestas_experimento \
         componentes menu plato bebida porcion menu_plato menu_bebida; do
  r=$(peticion GET "/rest/v1/$t?select=*&limit=1")
  c="${r%%|*}"
  b="${r#*|}"
  case "$c" in
    401|403|404) ok  "$(printf '%-28s %s (cerrada)' "$t" "$c")" ;;
    200)
      if [ "$b" = "[]" ]; then
        falla "$(printf '%-28s 200 con [] — LEGIBLE, solo la tapa que esté vacía' "$t")"
      else
        falla "$(printf '%-28s 200 CON DATOS — el estudio es público' "$t")"
      fi
      ;;
    *) aviso "$(printf '%-28s %s inesperado: %s' "$t" "$c" "$b")" ;;
  esac
done
echo

# ---------------------------------------------------------------------------
# 2. El estímulo sigue siendo legible (desviación documentada en 016:46-67)
#
# `personajes` y `catalogo_alimentos` son legibles a propósito: el participante
# nunca inicia sesión y sin ellas no hay simulación. No contienen datos de
# ninguna persona. Aquí se comprueba que siguen abiertas —si se cerraran, el
# simulador quedaría en blanco— y que anon NO puede escribirlas.
# ---------------------------------------------------------------------------
echo "[2] El estímulo: anon lee, anon no escribe (desviación documentada, 016:46-67)"
for t in personajes catalogo_alimentos; do
  r=$(peticion GET "/rest/v1/$t?select=slug&limit=3")
  c="${r%%|*}"
  b="${r#*|}"
  if [ "$c" = "200" ] && [ "$b" != "[]" ]; then
    ok "$(printf '%-20s 200 con filas (el simulador puede pintar)' "$t")"
  elif [ "$c" = "200" ]; then
    aviso "$(printf '%-20s 200 pero vacía: faltan los seeds' "$t")"
  else
    falla "$(printf '%-20s %s — el simulador no puede pintar el estímulo' "$t" "$c")"
  fi

  # Sonda de escritura. Columna inexistente a propósito: no puede insertar.
  r=$(peticion POST "/rest/v1/$t" '{"__sonda_no_existe__":1}')
  c="${r%%|*}"
  case "$c" in
    401|403|404) ok    "$(printf '%-20s escritura denegada (%s)' "$t" "$c")" ;;
    400)         aviso "$(printf '%-20s anon conserva el GRANT de INSERT (400 por columna, no por permiso)' "$t")" ;;
    2*)          falla "$(printf '%-20s anon PUEDE escribir el estímulo (%s)' "$t" "$c")" ;;
    *)           aviso "$(printf '%-20s escritura: %s inesperado' "$t" "$c")" ;;
  esac
done
echo

# ---------------------------------------------------------------------------
# 3. CRITERIO 2 — la RPC de envío sigue funcionando para anon
#
# Se manda un payload vacío. La respuesta correcta es un 400 con el mensaje de
# validación de la propia función: eso demuestra que anon LLEGÓ a ejecutarla.
# Un 401/403/404 significaría que anon perdió el EXECUTE y que ningún
# participante puede enviar su respuesta: el estudio deja de recoger datos.
#
# Esto NO prueba que un envío completo funcione de punta a punta; para eso hay
# que completar el flujo en el navegador. Prueba lo que pide el criterio: que la
# puerta sigue abierta para anon.
# ---------------------------------------------------------------------------
echo "[3] Criterio 2 — anon puede ejecutar la RPC de envío"
r=$(peticion POST "/rest/v1/rpc/registrar_respuesta_experimento" '{"payload":{}}')
c="${r%%|*}"
b="${r#*|}"
case "$c" in
  400)
    if printf '%s' "$b" | grep -q 'participante'; then
      ok "400 con la validación de la función: anon la ejecuta (y no escribió nada)"
    else
      aviso "400 pero con un mensaje inesperado: $b"
    fi
    ;;
  401|403|404) falla "anon NO puede ejecutar la RPC ($c): ningún participante puede enviar. $b" ;;
  200)         falla "200 con payload vacío: la función aceptó basura. Revisa 015." ;;
  *)           aviso "$c inesperado: $b" ;;
esac

# es_investigador() no es de anon: 013:60 la revoca de PUBLIC y solo la concede
# a authenticated (013:65).
r=$(peticion POST "/rest/v1/rpc/es_investigador" '{}')
c="${r%%|*}"
case "$c" in
  401|403|404) ok "es_investigador() no es ejecutable por anon ($c)" ;;
  *)           falla "es_investigador() responde $c a la clave anónima: debería estar cerrada" ;;
esac
echo

# ---------------------------------------------------------------------------
# 4. CRITERIO 3 (mitad de datos) — el investigador autorizado sí lee
#
# El guard de Angular es la primera puerta; esta es la que decide de verdad.
# Opcional porque exige una cuenta real: mientras la lista blanca de la 016 siga
# con PLACEHOLDER (016:156-162), este bloque no puede pasar para nadie.
# ---------------------------------------------------------------------------
echo "[4] Criterio 3 (capa de datos) — el investigador de la lista blanca lee el estudio"
if [ -z "${INVESTIGADOR_EMAIL:-}" ] || [ -z "${INVESTIGADOR_PASSWORD:-}" ]; then
  aviso "omitido: define INVESTIGADOR_EMAIL e INVESTIGADOR_PASSWORD para comprobarlo"
  echo "         (requiere una cuenta real; la lista blanca de la 016 sigue con PLACEHOLDER)"
else
  cuerpo=$(printf '{"email":"%s","password":"%s"}' "$INVESTIGADOR_EMAIL" "$INVESTIGADOR_PASSWORD")
  r=$(curl -s -w $'\n%{http_code}' -X POST "$URL/auth/v1/token?grant_type=password" \
        -H "apikey: $KEY" -H "Content-Type: application/json" -d "$cuerpo" 2>/dev/null)
  c=$(printf '%s' "$r" | tail -n 1)
  cuerpo_r=$(printf '%s' "$r" | sed '$d' | tr -d '\n')

  if [ "$c" != "200" ]; then
    falla "no se pudo iniciar sesión ($c): revisa la cuenta en Authentication -> Users"
  else
    jwt=$(printf '%s' "$cuerpo_r" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
    if [ -z "$jwt" ]; then
      falla "el login devolvió 200 pero sin access_token"
    else
      ok "sesión iniciada"

      r=$(peticion POST "/rest/v1/rpc/es_investigador" '{}' "$jwt")
      c="${r%%|*}"; b="${r#*|}"
      if [ "$c" = "200" ] && [ "$b" = "true" ]; then
        ok "es_investigador() devuelve true: la cuenta está en la lista blanca"
      else
        falla "es_investigador() devuelve '$b' ($c): la cuenta NO está en la lista blanca (016 sección 2)"
      fi

      r=$(peticion GET "/rest/v1/respuestas_experimento?select=decision_id&limit=1" "" "$jwt")
      c="${r%%|*}"; b="${r#*|}"
      if [ "$c" = "200" ] && [ "$b" != "[]" ]; then
        ok "la vista respuestas_experimento devuelve filas con sesión"
      elif [ "$c" = "200" ]; then
        aviso "la vista devuelve 200 con []: o el estudio está vacío, o la cuenta no está en la lista"
      else
        falla "la vista responde $c con sesión: el panel no puede cargar"
      fi
    fi
  fi
fi
echo

# ---------------------------------------------------------------------------
# Veredicto
# ---------------------------------------------------------------------------
echo "---------------------------------------------------------------------"
if [ "$fallos" -eq 0 ]; then
  echo "RESULTADO: sin fallos ($avisos aviso(s))."
  echo "El modelo de acceso del issue #7 se comporta como dice la migración 016."
  exit 0
fi

echo "RESULTADO: $fallos fallo(s), $avisos aviso(s)."
echo
echo "Un fallo en el bloque [1] es una fuga de datos de participantes de un"
echo "estudio real: aplica las migraciones en el orden 012 -> 013 -> 014 -> 016"
echo "(la 016 aborta sola si algo no cuadra) y vuelve a ejecutar esto."
exit 1
