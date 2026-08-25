import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlimentoCatalogo, ItemPlato } from '../../../models/contrato';
import {
  esRecipiente,
  OcupantePlato,
  posicionesDeItem,
  rotacionDePorcion,
  tamanoVisualPct
} from '../../../utils/plato-cuadrantes';

interface PorcionVista {
  key: string;
  x: number;
  y: number;
  tamano: number;
  rotacion: number;
  imagen: string;
  nombre: string;
  recipiente: boolean;
}

/**
 * Canvas del plato en 4 cuadrantes (Vía B, tarea B7).
 *
 * El posicionamiento es determinista: misma secuencia de clics, misma disposición.
 * Cada porción busca hueco libre; al quitar uno, los que quedan no se mueven.
 */
@Component({
  selector: 'app-plato-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="escena" aria-label="Plato de servicio">
      <div class="plato" aria-hidden="true"></div>
      <div class="alimentos">
        @for (porcion of porciones; track porcion.key) {
          <img
            class="porcion"
            [class.porcion--recipiente]="porcion.recipiente"
            [src]="porcion.imagen"
            [alt]="porcion.nombre"
            [style.left.%]="porcion.x"
            [style.top.%]="porcion.y"
            [style.width.%]="porcion.tamano"
            [style.z-index]="porcion.recipiente ? 6 : 1"
            [style.--giro]="porcion.rotacion + 'deg'"
            (error)="$any($event.target).style.visibility = 'hidden'"
          />
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
        overflow: visible;
      }

      .escena {
        position: relative;
        width: var(--plato-lado, min(380px, 38vw, 56vh));
        max-width: 100%;
        aspect-ratio: 1 / 1;
        overflow: visible;
      }

      .plato {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background:
          radial-gradient(circle at 50% 50%, #ffffff 58%, #f3f4f6 59%, #e5e7eb 72%, #d1d5db 73%, #f9fafb 74%);
        box-shadow: inset 0 0 0 10px #f3f4f6, 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .alimentos {
        position: absolute;
        inset: 0;
        overflow: visible;
        z-index: 1;
      }

      .porcion {
        position: absolute;
        height: auto;
        object-fit: contain;
        --giro: 0deg;
        transform: translate(-50%, -50%) rotate(var(--giro));
        pointer-events: none;
        animation: aparecer 220ms cubic-bezier(0.22, 1, 0.36, 1);
        filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.18));
      }

      .porcion--recipiente {
        filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.12));
      }

      @keyframes aparecer {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) rotate(var(--giro)) scale(0.85);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(var(--giro)) scale(1);
        }
      }
    `
  ]
})
export class PlatoCanvasComponent {
  porciones: PorcionVista[] = [];

  @Input()
  set items(valor: ItemPlato[]) {
    this.reconstruir(valor ?? [], this.catalogo);
  }

  @Input()
  set alimentos(valor: AlimentoCatalogo[]) {
    this.catalogo = new Map((valor ?? []).map(a => [a.id, a]));
    this.reconstruir(this.itemsCache, this.catalogo);
  }

  private itemsCache: ItemPlato[] = [];
  private catalogo = new Map<number, AlimentoCatalogo>();

  private reconstruir(items: ItemPlato[], catalogo: Map<number, AlimentoCatalogo>): void {
    this.itemsCache = items;
    const vistas: PorcionVista[] = [];
    const ocupados: OcupantePlato[] = [];

    for (const item of items) {
      const cat = catalogo.get(item.alimento_id);
      const slug = cat?.slug ?? item.slug;
      const tamano = tamanoVisualPct(slug, cat?.tipo ?? '');
      const recipiente = esRecipiente(slug);
      const posiciones = posicionesDeItem(item, tamano, ocupados);

      posiciones.forEach((pos, indice) => {
        vistas.push({
          key: `${item.alimento_id}-${indice}`,
          x: pos.x,
          y: pos.y,
          tamano,
          rotacion: rotacionDePorcion(item, indice),
          imagen: cat?.imagen ?? '',
          nombre: cat?.nombre ?? item.slug,
          recipiente
        });
        ocupados.push({ x: pos.x, y: pos.y, tamano, slug, recipiente });
      });
    }

    this.porciones = vistas.sort((a, b) => Number(a.recipiente) - Number(b.recipiente));
  }
}
