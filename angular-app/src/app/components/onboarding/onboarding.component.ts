import { Component } from '@angular/core';

// Stub de Fase 0 (issue #4). Lo implementa la Vía A en el issue #9.
@Component({
  selector: 'app-onboarding',
  standalone: true,
  template: `
    <main class="f0-stub">
      <h1>Instrucciones</h1>
      <p>Pantalla en construcción — Vía A, issue #9.</p>
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
export class OnboardingComponent {}
