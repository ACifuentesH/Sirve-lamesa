import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlimentoCatalogo, ItemPlato } from '../../../models/contrato';
import { posicionesDeItem, tamanoVisualPct } from '../../../utils/plato-cuadrantes';

interface PorcionVista {
  key: string;
  x: number;
  y: number;
  tamano: number;
  imagen: string;
  nombre: string;
}

/**
 * Canvas del plato en 4 cuadrantes (Vía B, tarea B7).
 *
 * El posicionamiento es determinista: misma secuencia de clics, misma disposición.
 * Las porciones del mismo alimento se escalonan 15 px; al quitar uno, los que
 * quedan no se mueven.
 */
@Component({
  selector: 'app-plato-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="escena" aria-label="Plato de servicio">
      <div class="plato">
        @for (porcion of porciones; track porcion.key) {
          <img
            class="porcion"
            [src]="porcion.imagen"
            [alt]="porcion.nombre"
            [style.left.%]="porcion.x"
            [style.top.%]="porcion.y"
            [style.width.%]="porcion.tamano"
            (error)="$any($event.target).style.visibility = 'hidden'"
          />
        }
      </div>
    </div>
  `,
  styles: [
    `
      .escena {
        display: grid;
        place-items: center;
      }

      .plato {
        position: relative;
        width: min(420px, 42vw, 70vh);
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        background:
          radial-gradient(circle at 50% 50%, #ffffff 58%, #f3f4f6 59%, #e5e7eb 72%, #d1d5db 73%, #f9fafb 74%);
        box-shadow: inset 0 0 0 10px #f3f4f6, 0 8px 24px rgba(0, 0, 0, 0.12);
        overflow: hidden;
      }

      .porcion {
        position: absolute;
        height: auto;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: aparecer 180ms ease-out;
      }

      @keyframes aparecer {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.85);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
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

    for (const item of items) {
      const cat = catalogo.get(item.alimento_id);
      const tamano = tamanoVisualPct(cat?.tipo ?? '');
      const posiciones = posicionesDeItem(item, tamano);

      posiciones.forEach((pos, indice) => {
        vistas.push({
          key: `${item.alimento_id}-${indice}`,
          x: pos.x,
          y: pos.y,
          tamano,
          imagen: cat?.imagen ?? '',
          nombre: cat?.nombre ?? item.slug
        });
      });
    }

    this.porciones = vistas;
  }
}
