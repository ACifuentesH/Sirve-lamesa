import { Component } from '@angular/core';

// Stub de Fase 0 (issue #4). Pantalla de servicio de la Vía B:
// banner (#16), avatar (#17), menú lateral (#18), porciones (#19),
// plato de cuadrantes (#20), bebida (#21) y validaciones (#22).
@Component({
  selector: 'app-simulador',
  standalone: true,
  template: `
    <main class="f0-stub">
      <h1>Simulador de servicio</h1>
      <p>Pantalla en construcción — Vía B, issues #16–#22.</p>
    </main>
  `,
  styles: [`
    .f0-stub {
      min-height: 100vh;
      display: grid;
      place-content: center;
      text-align: center;
      gap: 0.75rem;
      background: var(--sm-color-bg);
      color: var(--sm-color-text);
    }
    p { color: var(--sm-color-text-muted); }
  `]
})
export class SimuladorComponent {}
