# Imágenes del catálogo de alimentos

Las 34 fotografías del Anexo B, en el formato del contrato de assets (§0.4):

- Formato `.webp`, **256×256** exactos, **fondo transparente**.
- El nombre del archivo es el `slug` del alimento, carácter por carácter.
- La subcarpeta es el `momento_dia`: `desayuno/`, `almuerzo/` o `cena/`.
- Ruta final tal como la guarda el seed: `assets/foods/<momento>/<slug>.webp`.

`CatalogoService` lee la ruta desde `catalogo_alimentos.imagen`; el menú lateral y el
plato la pintan tal cual. No hay que tocar seed ni código al sustituir un archivo.

Un alimento aparece en dos momentos con slug distinto cuando cambia el peso o la
preparación (`huevo` en desayuno contra `huevo-cocido` en cena): son dos archivos.
La arepa de desayuno y la de cena (`arepa-tortilla-maiz`, `arepa-pequena`)
comparten la misma fotografía de origen.

## Los 34 archivos

La lista sale del seed (`database/seeds/seed_catalogo_alimentos.sql`). El peso en
gramos no se documenta aquí: es el dato que el participante nunca debe ver.

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
