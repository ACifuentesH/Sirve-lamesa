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
        min-width: 0;
        min-height: 0;
      }

      .avatar {
        margin: 0;
        width: min(100%, 20rem);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
      }

      img,
      .marcador {
        width: 100%;
        max-width: 100%;
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
        font-size: clamp(2rem, 8vw, 4rem);
        font-weight: 700;
        color: var(--sm-color-text-muted);
        border: 1px dashed var(--sm-color-border);
      }

      figcaption {
        text-align: center;
        font-family: var(--sm-font-sans);
        color: var(--sm-color-text);
        max-width: 100%;
      }

      .nombre {
        display: block;
        font-size: clamp(0.85rem, 1.4vw, 1.125rem);
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .perfil {
        display: block;
        font-size: clamp(0.7rem, 1.1vw, 0.875rem);
        color: var(--sm-color-text-muted);
      }

      @media (max-width: 900px) {
        :host {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
        }

        .avatar {
          width: min(40vw, 8.75rem);
          margin-inline: auto;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }

        figcaption {
          order: -1;
          text-align: center;
        }

        .nombre {
          font-size: 1rem;
        }

        .perfil {
          font-size: 0.8rem;
        }

        img,
        .marcador {
          width: 100%;
          max-width: none;
          border-radius: 16px;
        }

        .marcador {
          font-size: 2.5rem;
        }
      }

      @media (max-width: 900px) and (max-height: 560px) {
        .avatar {
          width: min(28vw, 6.5rem);
        }

        .nombre {
          font-size: 0.85rem;
        }
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
