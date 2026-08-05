# Angular como framework del entregable, frente a la instrucción Lovable/React

El documento de especificaciones de la Fundación instruye usar Lovable u homólogos que generen React/TypeScript/Tailwind, justificado por tiempos de entrega. Decidimos **mantener Angular 19**: el entregable real que define la §7.2 es "código estándar, limpio y 100% descargable, listo para incrustar mediante iframe", y el build estático de Angular lo cumple; migrar a React descartaría la infraestructura funcional existente (routing, servicios, guards, panel de análisis) y sería una reescritura total, no un ahorro. Lovable era el medio propuesto, no el fin.

La `react-app/` esqueleto se retira del working tree (issue #24). La decisión se defiende por escrito ante la Fundación antes de codificar (issue #1, pregunta 4).
