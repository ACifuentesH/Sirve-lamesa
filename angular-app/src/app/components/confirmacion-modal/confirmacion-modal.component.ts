import {
  AfterViewInit, Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Vía A (issue #10): modal de confirmación de dos pasos (§6.1). La Vía B solo
// lo instancia (issue #22) pasando nombrePersonaje; no conoce su interior.
// Textos literales del documento — no editar sin acuerdo.
@Component({
  selector: 'app-confirmacion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="onCancelar()">
      <div class="modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="titulo-confirmacion"
           (click)="$event.stopPropagation()"
           (keydown)="trapFoco($event)">
        <h2 id="titulo-confirmacion">¿Deseas guardar y enviar esta porción?</h2>
        <p>
          Has configurado el plato para {{ nombrePersonaje }}. Una vez que envíes la
          simulación, tus respuestas se registrarán de forma definitiva y no podrás
          modificarlas.
        </p>
        <div class="acciones">
          <button #btnCancelar
                  type="button"
                  class="secundario"
                  [disabled]="isSubmitting"
                  (click)="onCancelar()">Volver a revisar</button>
          <button #btnConfirmar
                  type="button"
                  class="principal"
                  [disabled]="isSubmitting"
                  (click)="onConfirmar()">
            <span class="spinner" *ngIf="isSubmitting" aria-hidden="true"></span>
            Sí, enviar porción
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(31, 41, 55, 0.55);
      display: grid;
      place-items: center;
      z-index: 1000;
    }
    .modal {
      width: min(480px, calc(100vw - 2rem));
      background: var(--sm-color-bg);
      color: var(--sm-color-text);
      border-radius: 8px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
      padding: 2rem;
    }
    h2 { font-size: 1.375rem; font-weight: 700; }
    p { margin-top: 0.75rem; color: var(--sm-color-text-muted); line-height: 1.5; }
    .acciones {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    button {
      font-family: var(--sm-font-sans);
      font-size: 1rem;
      font-weight: 600;
      border-radius: 4px;
      padding: 0.65rem 1.1rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    button:disabled { cursor: not-allowed; opacity: 0.7; }
    .secundario {
      background: var(--sm-color-bg);
      color: var(--sm-color-text);
      border: 1px solid var(--sm-color-border);
    }
    .secundario:hover:not(:disabled) { background: var(--sm-color-bg-alt); }
    .principal {
      background: var(--sm-color-primary);
      color: var(--sm-color-bg);
      border: none;
    }
    .principal:hover:not(:disabled) { background: var(--sm-color-primary-dark); }
    .spinner {
      width: 1em;
      height: 1em;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: girar 0.7s linear infinite;
    }
    @keyframes girar { to { transform: rotate(360deg); } }
  `]
})
export class ConfirmacionModalComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) nombrePersonaje!: string;
  @Input() isSubmitting = false;
  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  @ViewChild('btnCancelar') btnCancelar!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnConfirmar') btnConfirmar!: ElementRef<HTMLButtonElement>;

  // Evita el doble envío por doble clic; se rearma si el envío falla y
  // el padre vuelve a poner isSubmitting en false (reintento, issue #12).
  private yaConfirmado = false;

  ngAfterViewInit(): void {
    this.btnCancelar.nativeElement.focus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isSubmitting'] && !this.isSubmitting) {
      this.yaConfirmado = false;
    }
  }

  onConfirmar(): void {
    if (this.isSubmitting || this.yaConfirmado) return;
    this.yaConfirmado = true;
    this.confirmado.emit();
  }

  onCancelar(): void {
    if (this.isSubmitting) return;
    this.cancelado.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancelar();
  }

  // Trampa de foco: con dos únicos focusables, Tab y Shift+Tab alternan entre ellos.
  trapFoco(ev: KeyboardEvent): void {
    if (ev.key !== 'Tab') return;
    ev.preventDefault();
    const destino = document.activeElement === this.btnConfirmar.nativeElement
      ? this.btnCancelar
      : this.btnConfirmar;
    destino.nativeElement.focus();
  }
}
