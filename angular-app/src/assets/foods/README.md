# Imágenes del catálogo de alimentos

**Estado: las 34 imágenes de este árbol son marcadores provisionales, no material de
estímulo.** Se ven como un cuadro gris con borde discontinuo y la palabra
`PROVISIONAL`. Existen para que la pantalla de servicio se pueda validar de extremo a
extremo mientras llegan las fotografías reales (issue #15, tarea B2 del plan).

**No desplegar el experimento con estos archivos puestos.** El alimento que ve el
participante es parte del estímulo: un marcador gris en lugar de una foto de comida
cambia la tarea que se está midiendo.

## Qué falta

Las 34 fotografías reales, con estas restricciones del contrato de assets (§0.4 del
plan y `AlimentoCatalogo.imagen`):

- Formato `.webp`, **256×256** exactos, **fondo transparente**.
- El nombre del archivo es el `slug` del alimento, carácter por carácter.
- La subcarpeta es el `momento_dia`: `desayuno/`, `almuerzo/` o `cena/`.
- Ruta final tal como la guarda el seed: `assets/foods/<momento>/<slug>.webp`.

Un alimento aparece en dos momentos con slug distinto cuando cambia el peso o la
preparación (`huevo` en desayuno contra `huevo-cocido` en cena): son dos archivos, no
uno compartido.

## Cómo reemplazarlos

Basta con sobrescribir cada `.webp` respetando nombre y carpeta; no hay que tocar el
seed ni el código. `CatalogoService` lee la ruta desde `catalogo_alimentos.imagen` y
el menú lateral la pinta tal cual.

Cuando lleguen las 34 reales, borrar también `scripts/generar-placeholders-catalogo.mjs`
y este README: dejan de tener sentido.

## Los 34 archivos esperados

La lista sale del seed (`database/seeds/seed_catalogo_alimentos.sql`), que es la única
fuente de slugs y rutas. El peso en gramos no se documenta aquí a propósito: es el dato
que el participante nunca debe ver.

### Desayuno (11)

| Archivo | Alimento | Tipo | Unidad de display |
|---|---|---|---|
| `pan-tostado.webp` | Pan Tostado | carbohidrato | 1 rebanada |
| `arepa-tortilla-maiz.webp` | Arepa o Tortilla de Maíz | carbohidrato | 1 unidad mediana |
| `cereal-hojuelas.webp` | Cereal de hojuelas | carbohidrato | 1 porción en tazón |
| `galletas-soda.webp` | Galletas de soda/integrales | carbohidrato | 1 paquete (4 galletas) |
| `huevo.webp` | Huevo (Frito, Revuelto o Cocido) | proteina | 1 unidad |
| `queso.webp` | Queso Blanco / Amarillo | lacteo | 1 rebanada grosor medio |
| `jamon.webp` | Jamón de Pavo / Cerdo | proteina | 1 rebanada delgada |
| `yogur.webp` | Yogur Natural / Frutos Rojos | lacteo | 1 envase pequeño |
| `fruta-rodajas.webp` | Fruta en rodajas (Manzana, Banano o Melón) | fruta | 1 porción |
| `cafe-leche.webp` | Taza de Café con Leche / Negro | bebida | 1 taza |
| `jugo-naranja.webp` | Vaso de Jugo de Naranja | bebida | 1 vaso |

### Almuerzo (12)

| Archivo | Alimento | Tipo | Unidad de display |
|---|---|---|---|
| `arroz.webp` | Arroz Blanco o Integral | carbohidrato | 1 cucharada de servicio (cucharón) |
| `pasta.webp` | Pasta / Espagueti | carbohidrato | 1 porción mediana de servicio |
| `papa.webp` | Puré de Papa o Papas Cocidas | carbohidrato | 1 porción / 1 papa mediana |
| `platano-maduro.webp` | Plátano Maduro (Horneado o Frito) | carbohidrato | 2 tajadas/rodajas |
| `pechuga-pollo.webp` | Pechuga de Pollo a la plancha | proteina | 1 filete mediano |
| `carne-res.webp` | Carne de Res molida o en bistec | proteina | 1 porción estándar |
| `pescado.webp` | Filete de Pescado | proteina | 1 unidad regular |
| `granos-legumbres.webp` | Granos / Legumbres (Frijoles, Lentejas o Garbanzos) | proteina | 1 cucharada de servicio |
| `ensalada-fresca.webp` | Ensalada Fresca (Lechuga, Tomate, Pepino) | vegetal | 1 porción abundante |
| `vegetales-vapor.webp` | Vegetales al Vapor (Zanahoria, Brócoli, Calabacín) | vegetal | 1 porción |
| `agua-mineral.webp` | Vaso de Agua Mineral | bebida | 1 vaso |
| `te-jugo-natural.webp` | Vaso de Té Frío o Jugo Natural | bebida | 1 vaso |

### Cena (11)

| Archivo | Alimento | Tipo | Unidad de display |
|---|---|---|---|
| `pan-integral.webp` | Pan Integral o Árabe | carbohidrato | 1 rebanada / 1 unidad |
| `arepa-pequena.webp` | Arepa Pequeña / Tortilla de Trigo | carbohidrato | 1 unidad |
| `galletas-maiz-arroz.webp` | Galletas Horneadas de Maíz / Arroz | carbohidrato | 2 unidades |
| `pollo-desmechado.webp` | Pechuga de Pollo desmechada | proteina | 1 porción pequeña |
| `atun.webp` | Atún en agua | proteina | 1 porción (media lata) |
| `huevo-cocido.webp` | Huevo Cocido / Pochado | proteina | 1 unidad |
| `ricotta-cuajada.webp` | Queso Ricotta / Cuajada ligera | lacteo | 1 porción |
| `sopa-verduras.webp` | Sopa / Crema de Verduras | vegetal | 1 tazón mediano |
| `tomate-aguacate.webp` | Rodajas de Tomate y Aguacate | vegetal | 1 porción mixta |
| `infusion-te.webp` | Taza de Infusión / Té Caliente (Aromática) | bebida | 1 taza |
| `leche-descremada.webp` | Vaso de Leche descremada | bebida | 1 vaso |

