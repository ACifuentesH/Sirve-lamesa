import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { MomentoDia, Personaje } from '../../../models/contrato';
import { TextoContexto, construirTextoContexto } from '../../../utils/texto-contexto';

/**
 * Banner de contextualización (Vía B, tarea B3; §3 del documento).
 *
 * Fijo arriba y sin botón de cerrar a propósito: es la única indicación de a quién se
 * sirve y qué comida es, y si el participante lo pierde de vista mientras recorre el
 * menú, la tarea deja de tener contexto.
 */
@Component({
  selector: 'app-banner-contexto',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (texto()) {
      <div class="banner" role="status" aria-live="polite">
        <span class="encabezado">{{ texto()!.encabezado }}</span>
        {{ texto()!.antesMomento }}
        <strong>{{ texto()!.momento }}</strong>
        {{ texto()!.antesNombre }}
        <strong>{{ texto()!.nombre }}</strong>
        (<strong>{{ texto()!.perfil }}</strong>).
        {{ texto()!.cierre }}
      </div>
    }
  `,
  styles: [
    `
      .banner {
        position: sticky;
        top: 0;
        z-index: 100;
        width: 100%;
        box-sizing: border-box;
        padding: 0.75rem 1.5rem;
        background: var(--sm-color-primary-light);
        border-bottom: 1px solid var(--sm-color-info-border);
        color: var(--sm-color-text);
        font-family: var(--sm-font-sans);
        font-size: 1.125rem;
        line-height: 1.5;
      }

      .encabezado {
        font-weight: 700;
        margin-right: 0.25rem;
      }

      strong {
        font-weight: 700;
      }
    `
  ]
})
export class BannerContextoComponent {
  private readonly personajeSig = signal<Personaje | null>(null);
  private readonly momentoSig = signal<MomentoDia | null>(null);

  @Input({ required: true })
  set personaje(valor: Personaje | null) {
    this.personajeSig.set(valor);
  }

  @Input({ required: true })
  set momentoDia(valor: MomentoDia | null) {
    this.momentoSig.set(valor);
  }

  readonly texto = computed<TextoContexto | null>(() => {
    const personaje = this.personajeSig();
    const momento = this.momentoSig();
    return personaje && momento ? construirTextoContexto(personaje, momento) : null;
  });
}
