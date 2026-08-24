# Contrato de datos — envío consolidado del experimento

**Estado: congelado tras la Fase 0 (issue #2).** Cualquier cambio requiere acuerdo de las dos vías, en commit propio y pequeño, mergeado a `develop` el mismo día (Sección 7 del plan). Espejo TypeScript en `angular-app/src/app/models/contrato/`.

## Transporte

El envío es **una sola llamada RPC a Supabase** (ADR-0001), al final del flujo — nunca envíos parciales por pantalla:

```ts
const { data, error } = await supabase.rpc('registrar_respuesta_experimento', { payload });
```

- **Éxito**: `data = { "success": true, "participante_id": N, "sesion_id": N, "decision_id": N }`.
- **Fallo de validación o de inserción**: la RPC lanza error con mensaje descriptivo (`error.message`); no queda ningún registro huérfano (transacción única).
- **Fallo de red**: lo maneja el `EnvioService` (issue #12) con reintentos y respaldo local; el payload nunca se descarta.

## Payload (ejemplo completo)

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

## Reglas no negociables

1. Si no hay bebida, `"bebida": null` y `"total_bebida_ml": 0`. **Nunca se omite la clave** (§5.4).
2. `total_plato_gramos` **excluye** la bebida: es contenedor externo (§5.2, pestaña 4).
3. `tiempo_decision_segundos` es decimal con un decimal, desde que se monta la pantalla de servicio hasta el clic en "Sí, enviar porción".
4. `secuencia_clics` va en orden cronológico ascendente. `alimento_slug` es `null` solo para `cambio_pestana`, que añade el campo `pestana`.
5. `porciones` de cada alimento es 1..4. La RPC rechaza más de 4 y rechaza plato vacío (un plato con solo bebida cuenta como vacío).
6. El servidor **recalcula** `total_plato_gramos` desde `porciones × peso_gramos` leídos de la BD; si difiere del valor del cliente, prevalece el del servidor y se deja constancia en notas.
7. `fecha_inicio` en ISO 8601 UTC.

## Quién produce y quién consume

- **Vía B** compila el `PayloadEnvio` (issue #22) y lo entrega al `EnvioService`.
- **Vía A** implementa la RPC (issue #6) y el `EnvioService` (issue #12).
- La constante `ASIGNACIONES_POR_PARTICIPANTE` (default `1`) vive en el contrato; ver issue #1 (pregunta 1 a la Fundación).
