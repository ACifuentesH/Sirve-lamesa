export function personajeImagenSrc(imagen?: string | null): string | null {
  const file = imagen?.trim();
  if (!file) return null;
  return `/assets/images/${file}`;
}
