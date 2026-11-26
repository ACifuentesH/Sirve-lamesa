// Contrato Fase 0 (issue #2) — congelado: cambios solo por acuerdo de ambas vías.

/**
 * Personajes que sirve cada participante en una sesión.
 * 3 = cada participante recorre el ciclo completo del día: desayuno,
 * almuerzo y cena, en ese orden (acordado en la reunión de validación;
 * antes era 1 plato con momento sorteado). El momento de cada plato lo
 * fija su posición en la secuencia (ver AsignacionService).
 */
export const ASIGNACIONES_POR_PARTICIPANTE = 3;

/** Nombre de la función Postgres del envío consolidado (ADR-0001, issue #6). */
export const RPC_REGISTRAR_RESPUESTA = 'registrar_respuesta_experimento';
