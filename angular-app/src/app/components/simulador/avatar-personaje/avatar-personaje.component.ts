import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Personaje } from '../../../models/contrato';

/**
 * Columna del avatar (Vía B, tarea B4; §4.4 del documento).
 *
 * Las dimensiones van explícitas y la carga es `eager` porque el avatar es lo primero
 * que mira el participante: si entra tarde, la página salta y el plato se mueve justo
 * cuando se está decidiendo dónde servir.
 *
 * Si la imagen falta, cae a la inicial del nombre en lugar de dejar el icono de
 * imagen rota.
 */
@Component({
  selector: 'app-avatar-personaje',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (personaje) {
      <figure class="avatar">
        @if (imagenDisponible) {
          <img
            [src]="personaje.imagen"
            [alt]="'Retrato de ' + personaje.nombre"
            width="500"
            height="500"
            loading="eager"
            decoding="sync"
            (error)="imagenDisponible = false"
          />
        } @else {
          <div class="marcador" [attr.aria-label]="'Retrato de ' + personaje.nombre">
            {{ personaje.nombre.charAt(0) }}
          </div>
        }
        <figcaption>
          <span class="nombre">{{ personaje.nombre }}</span>
          <span class="perfil">{{ personaje.perfil_edad }}</span>
        </figcaption>
      </figure>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }

      img,
      .marcador {
        width: 100%;
        max-width: 180px;
        aspect-ratio: 1 / 1;
        height: auto;
        border-radius: 16px;
        background: var(--sm-color-bg-alt);
        object-fit: cover;
      }

      .marcador {
        display: grid;
        place-items: center;
        font-family: var(--sm-font-sans);
        font-size: 4rem;
        font-weight: 700;
        color: var(--sm-color-text-muted);
        border: 1px dashed var(--sm-color-border);
      }

      figcaption {
        text-align: center;
        font-family: var(--sm-font-sans);
        color: var(--sm-color-text);
      }

      .nombre {
        display: block;
        font-size: 1.125rem;
        font-weight: 700;
      }

      .perfil {
        display: block;
        font-size: 0.875rem;
        color: var(--sm-color-text-muted);
      }
    `
  ]
})
export class AvatarPersonajeComponent {
  private personajeActual: Personaje | null = null;
  imagenDisponible = true;

  @Input({ required: true })
  set personaje(valor: Personaje | null) {
    if (valor?.id !== this.personajeActual?.id) {
      this.imagenDisponible = true;
    }
    this.personajeActual = valor;
  }

  get personaje(): Personaje | null {
    return this.personajeActual;
  }
}
