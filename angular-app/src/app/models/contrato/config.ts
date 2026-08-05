// Contrato Fase 0 (issue #2) — congelado: cambios solo por acuerdo de ambas vías.

/**
 * Personajes que sirve cada participante en una sesión.
 * Default 1 = diseño entre-sujetos; pendiente de confirmación escrita
 * de la Fundación (issue #1, pregunta 1). Cambiarlo aquí reactiva la
 * secuencia completa sin tocar componentes.
 */
export const ASIGNACIONES_POR_PARTICIPANTE = 1;

/** Nombre de la función Postgres del envío consolidado (ADR-0001, issue #6). */
export const RPC_REGISTRAR_RESPUESTA = 'registrar_respuesta_experimento';
