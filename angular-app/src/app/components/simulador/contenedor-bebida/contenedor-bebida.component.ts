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
      .contenedor {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .vaso {
        width: 110px;
        height: 150px;
        display: grid;
        place-items: center;
        border: 2px dashed var(--sm-color-border);
        border-radius: 8px 8px 16px 16px;
        background: var(--sm-color-bg-alt);
      }

      .vaso--lleno {
        border-style: solid;
        border-color: var(--sm-color-info-border);
        background: var(--sm-color-primary-light);
      }

      .vaso img {
        width: 80%;
        height: auto;
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
        max-width: 140px;
      }

      .nombre {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--sm-color-text);
      }

      .detalle,
      .vacio {
        display: block;
        font-size: 0.875rem;
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
