import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlimentoCatalogo } from '../../../models/contrato';

/**
 * Contenedor externo de bebida (Vía B, tarea B8; §5.2 del documento).
 *
 * La bebida va al lado del plato y nunca dentro. No es un detalle estético: los ml de
 * la bebida no pueden mezclarse con los gramos del plato, que son la variable del
 * estudio, y renderizarla en el círculo invitaría a contarla como comida.
 *
 * Servir sin bebida es una respuesta válida (§5.4) y el contenedor lo muestra vacío
 * en lugar de reclamar una elección.
 */
@Component({
  selector: 'app-contenedor-bebida',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contenedor">
      <div class="vaso" [class.vaso--lleno]="!!bebida">
        @if (bebida) {
          @if (imagenDisponible) {
            <img
              [src]="bebida.imagen"
              [alt]="bebida.nombre"
              width="256"
              height="256"
              (error)="imagenDisponible = false"
            />
          } @else {
            <span class="marcador">{{ bebida.nombre.charAt(0) }}</span>
          }
        }
      </div>

      <div class="etiqueta">
        @if (bebida) {
          <span class="nombre">{{ bebida.nombre }}</span>
          <span class="detalle">
            {{ porciones }} × {{ bebida.unidad_display }}
          </span>
        } @else {
          <span class="vacio">Sin bebida</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .contenedor {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.65rem;
        max-width: 100%;
      }

      .vaso {
        width: var(--vaso-ancho, clamp(100px, 18vw, 210px));
        height: var(--vaso-alto, clamp(140px, 34vh, 300px));
        max-width: 100%;
        display: grid;
        place-items: center;
        border: 1px dashed color-mix(in srgb, var(--sm-color-border) 80%, transparent);
        border-radius: 999px 999px 28px 28px;
        background: color-mix(in srgb, var(--sm-color-bg-alt) 70%, transparent);
        transition: border-color 180ms ease, background 180ms ease;
      }

      .vaso--lleno {
        border-style: none;
        background: transparent;
      }

      .vaso img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        animation: servir 280ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      @keyframes servir {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

      .marcador {
        font-family: var(--sm-font-sans);
        font-size: 2rem;
        font-weight: 700;
        color: var(--sm-color-primary);
      }

      .etiqueta {
        text-align: center;
        font-family: var(--sm-font-sans);
        max-width: min(180px, 100%);
      }

      .nombre {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        color: var(--sm-color-text);
      }

      .detalle,
      .vacio {
        display: block;
        font-size: 0.75rem;
        color: var(--sm-color-text-muted);
      }
    `
  ]
})
export class ContenedorBebidaComponent {
  private bebidaActual: AlimentoCatalogo | null = null;
  @Input() porciones = 0;
  imagenDisponible = true;

  @Input()
  set bebida(valor: AlimentoCatalogo | null) {
    if (valor?.id !== this.bebidaActual?.id) {
      this.imagenDisponible = true;
    }
    this.bebidaActual = valor;
  }

  get bebida(): AlimentoCatalogo | null {
    return this.bebidaActual;
  }
}
