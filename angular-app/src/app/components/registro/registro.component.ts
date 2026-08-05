import { Component } from '@angular/core';

// Stub de Fase 0 (issue #4). Lo implementa la Vía A en el issue #8.
@Component({
  selector: 'app-registro',
  standalone: true,
  template: `
    <main class="f0-stub">
      <h1>Registro del participante</h1>
      <p>Pantalla en construcción — Vía A, issue #8.</p>
    </main>
  `,
  styles: [`
    .f0-stub {
      min-height: 100vh;
      display: grid;
      place-content: center;
      text-align: center;
      gap: 0.75rem;
      background: var(--sm-color-bg-alt);
      color: var(--sm-color-text);
    }
    p { color: var(--sm-color-text-muted); }
  `]
})
export class RegistroComponent {}
