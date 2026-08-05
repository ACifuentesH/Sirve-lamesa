// Contrato Fase 0 (issue #2) — congelado: cambios solo por acuerdo de ambas vías.

export type MomentoDia = 'desayuno' | 'almuerzo' | 'cena';
export type PerfilEdad = 'Niño' | 'Niña' | 'Joven' | 'Adulto' | 'Adulto Mayor';

export interface Personaje {
  id: number;
  slug: string;              // 'santi'
  nombre: string;            // 'Santi'
  perfil_edad: PerfilEdad;
  edad_rango: string;        // '7-9'
  genero: 'M' | 'F';
  imagen: string;            // 'assets/characters/santi.webp' — ruta relativa siempre (§7.2)
  pronombre: 'él' | 'ella';  // para el banner: "adecuadas para él/ella"
}
