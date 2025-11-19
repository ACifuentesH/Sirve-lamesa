export interface Menu {
  pk_menu: number;
  nombre: string;
}

export interface Plato {
  pk_plato: number;
  nombre: string;
  descripcion?: string;
}

export interface Componente {
  pk_alimento: number;
  nombre: string;
  descripcion?: string;
  cantidad?: number;
  unidad_medida?: string;
}

export interface Bebida {
  pk_bebida: number;
  nombre: string;
  descripcion?: string;
}

export interface Porcion {
  pk_porcion: number;
  fk_plato: number;
  fk_alimento: number;
  unidad_medida: string;
  cantidad?: number;
}
