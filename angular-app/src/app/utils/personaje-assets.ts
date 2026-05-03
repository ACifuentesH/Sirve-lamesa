/** Rutas de retratos en `src/assets/images/` (nombre de archivo = columna `imagen` en BD). */
export function personajeImagenSrc(imagen: string | null | undefined): string | null {
  const file = imagen?.trim();
  if (!file) return null;
  return `assets/images/${file}`;
}
