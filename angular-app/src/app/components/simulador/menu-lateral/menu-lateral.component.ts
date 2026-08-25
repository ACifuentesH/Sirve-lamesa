import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { AlimentoCatalogo, MomentoDia } from '../../../models/contrato';
import { CatalogoService } from '../../../services/catalogo.service';

/**
 * Menú lateral por momento del día (Vía B, B5 y B6).
 *
 * Las pestañas salen del campo `grupo`, no de una lista fija: desayuno y cena no
 * comparten nombres, y hardcodearlas mostraría pestañas vacías o alimentos de
 * otro momento. Bebidas va siempre al final, porque su contenido no entra al plato.
 *
 * Los gramos no se pintan. Son el dato del análisis; enseñarlos sesgaría la
 * decisión del participante (§5.2).
 */
@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-lateral.component.html',
  styleUrls: ['./menu-lateral.component.scss']
})
export class MenuLateralComponent implements OnChanges {
  private readonly catalogo = inject(CatalogoService);

  @Input({ required: true }) momentoDia!: MomentoDia;
  @Input() porcionesPorId: ReadonlyMap<number, number> = new Map();
  @Input() tocados: ReadonlySet<number> = new Set();

  @Output() agregar = new EventEmitter<AlimentoCatalogo>();
  @Output() quitar = new EventEmitter<AlimentoCatalogo>();
  @Output() cambioPestana = new EventEmitter<string>();

  alimentos: AlimentoCatalogo[] = [];
  pestanas: string[] = [];
  pestanaActiva = '';
  cargando = true;
  error = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['momentoDia'] && this.momentoDia) {
      this.cargar();
    }
  }

  alimentosDePestana(): AlimentoCatalogo[] {
    return this.alimentos.filter(a => a.grupo === this.pestanaActiva);
  }

  porcionesDe(id: number): number {
    return this.porcionesPorId.get(id) ?? 0;
  }

  mostrarContador(id: number): boolean {
    return this.tocados.has(id);
  }

  enTope(id: number): boolean {
    return this.porcionesDe(id) >= 4;
  }

  etiquetaPestana(grupo: string): string {
    const cortos: Record<string, string> = {
      'Carbohidratos y Acompañamientos': 'Harinas',
      'Carbohidratos Ligeros / Acompañamientos': 'Harinas',
      'Proteínas y Legumbres': 'Proteínas',
      'Proteínas Ligeras': 'Proteínas',
      'Proteínas y Lácteos': 'Proteínas',
      'Vegetales y Ensaladas': 'Vegetales',
      'Vegetales y Frutas': 'Vegetales',
      'Frutas y Elementos Frescos': 'Frutas',
      Bebidas: 'Bebidas'
    };
    return cortos[grupo] ?? grupo;
  }

  seleccionarPestana(grupo: string): void {
    if (grupo === this.pestanaActiva) {
      return;
    }
    this.pestanaActiva = grupo;
    this.cambioPestana.emit(grupo);
  }

  onAgregar(alimento: AlimentoCatalogo): void {
    if (this.enTope(alimento.id)) {
      return;
    }
    this.agregar.emit(alimento);
  }

  onQuitar(alimento: AlimentoCatalogo): void {
    if (this.porcionesDe(alimento.id) <= 0) {
      return;
    }
    this.quitar.emit(alimento);
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.catalogo.obtenerCatalogo(this.momentoDia).subscribe({
      next: alimentos => {
        this.alimentos = alimentos;
        this.pestanas = this.ordenarPestanas(alimentos);
        this.pestanaActiva = this.pestanas[0] ?? '';
        this.cargando = false;
      },
      error: err => {
        this.error = err instanceof Error ? err.message : 'No se pudo cargar el menú.';
        this.cargando = false;
      }
    });
  }

  /**
   * Grupos de comida en el orden del catálogo, bebidas al final. Así la pestaña 4
   * es siempre Bebidas, como pide la §5.2, sin asumir los nombres de las otras tres.
   */
  private ordenarPestanas(alimentos: AlimentoCatalogo[]): string[] {
    const comida: string[] = [];
    let bebidas: string | null = null;

    for (const alimento of alimentos) {
      if (alimento.es_bebida) {
        bebidas = alimento.grupo;
        continue;
      }
      if (!comida.includes(alimento.grupo)) {
        comida.push(alimento.grupo);
      }
    }

    return bebidas ? [...comida, bebidas] : comida;
  }
}
