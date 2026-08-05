# Sirve la Mesa

Plataforma de investigación en psicología de la alimentación: un participante sirve comida a personajes sintéticos y el sistema registra qué, cuánto y en qué orden sirve, para detectar sesgos de porcionamiento según las características sociodemográficas del personaje. La metáfora de restaurante es el estímulo del experimento, no el dominio: no hay meseros, clientes ni pedidos reales.

## Language

### El estudio

**Participante**:
El sujeto humano del experimento. Se registra de forma anónima con datos antropométricos y sociodemográficos.
_Avoid_: usuario, jugador, cliente

**Investigador**:
Quien analiza y exporta los datos del estudio desde el panel de análisis, con sesión autenticada.
_Avoid_: administrador, admin

**Sesión**:
Una partida completa de un participante; la unidad experimental del estudio.
_Avoid_: partida, sesión de usuario

**Decisión**:
El hecho que registra el estudio: un plato servido por el participante a un personaje, con su composición, cantidad, tiempo y secuencia de clics.
_Avoid_: pedido, respuesta, jugada

**Respuesta de experimento**:
La forma aplanada de una decisión con su participante y sesión — una fila por decisión — tal como la consulta y exporta la Fundación.

**Porcionamiento**:
El fenómeno estudiado: cuánto y qué comida sirve el participante a cada personaje.

**Registro de participante**:
El alta anónima de un participante con su consentimiento informado. El participante nunca se autentica; solo los investigadores tienen login.
_Avoid_: login, autenticación

**EAT-26**:
Instrumento psicométrico de conductas alimentarias presente en el esquema; su vigencia está pendiente de confirmación por la Fundación.

### El estímulo

**Personaje**:
Comensal ficticio al que el participante sirve comida: ocho en total, un hombre y una mujer por cada perfil de edad. Es el estímulo experimental, no un usuario.
_Avoid_: comensal, avatar, NPC

**Perfil de edad**:
La franja vital que un personaje representa: Niño, Joven, Adulto o Adulto Mayor.
_Avoid_: rango de edad (para el perfil), tipo

**Asignación**:
El personaje y el momento del día sorteados a un participante para su sesión. Cuántos personajes recibe cada participante lo gobierna una constante de configuración (por defecto, uno).
_Avoid_: escenario

**IMC representado**:
La complexión corporal que el retrato de un personaje aparenta. Variable de estímulo de la matriz anterior de personajes; la matriz nueva no la varía, pero el dato histórico la conserva.
_Avoid_: imc (sin calificar, para personajes)

**Momento del día**:
El contexto de comida en que transcurre la sesión: desayuno, almuerzo o cena. Determina qué catálogo ve el participante.
_Avoid_: escenario, menú

### La comida

**Alimento**:
La unidad atómica de comida que el participante añade al plato desde el catálogo. El participante ve su unidad de display ("1 rebanada"), nunca su peso en gramos: exponerlo sesgaría la decisión.
_Avoid_: componente, ingrediente

**Catálogo**:
El conjunto de alimentos disponibles para un momento del día. Tres catálogos, 34 alimentos en total, con pesos fijados por el protocolo.
_Avoid_: menú, carta

**Tipo**:
La clase de análisis de un alimento: proteína, carbohidrato, vegetal, fruta, lácteo o bebida. Alimenta los agregados por categoría de la exportación.
_Avoid_: categoría

**Grupo**:
El rótulo de la pestaña bajo la que un alimento aparece en el menú lateral (p. ej. "Proteínas y Lácteos"). Es presentación, cambia entre momentos del día y no participa en el análisis.
_Avoid_: pestaña (para el dato), categoría

**Porción**:
Una unidad de un alimento añadida al plato con el control de suma, con tope de cuatro por alimento. Su peso en gramos lo fija el catálogo.
_Avoid_: ración

**Plato servido**:
La composición de alimentos que el participante arma libremente y entrega a un personaje; el resultado de una decisión. Su total en gramos excluye siempre la bebida.

**Cuadrante**:
Cada una de las cuatro zonas del plato (superior/inferior × izquierda/derecha) donde los alimentos se colocan de forma determinista y reproducible.

**Contenedor externo**:
El vaso o taza junto al plato donde va la bebida, una a la vez y opcional. Su volumen se mide en ml, nunca sumado a los gramos del plato.

### Variables y medidas

**IMC medido**:
El índice de masa corporal calculado a partir del peso y la altura reales del participante.
_Avoid_: imc (sin calificar, para participantes)

**Género**:
Cubre dos variables distintas que siempre se nombran calificadas: el género del participante (variable del sujeto, cuatro opciones) y el género del personaje (variable del estímulo, M/F). El cruce entre ambas es la hipótesis central del estudio.
_Avoid_: sexo

**Tiempo de decisión**:
Los segundos (con un decimal) que tarda el participante desde que se le presenta la pantalla de servicio hasta que confirma el envío.

**Secuencia de clics**:
El registro conductual cronológico de la tarea: cada agregar, quitar y cambio de pestaña con su timestamp relativo al inicio.

**Orden de servicio**:
La posición que ocupa un personaje en la secuencia en que el participante sirvió durante la sesión (relevante cuando la asignación es de más de un personaje).

**Ranking de personajes**:
Hallazgo del panel de análisis: los personajes ordenados por gramos promedio recibidos. No es una puntuación del juego.
_Avoid_: puntuación, score
