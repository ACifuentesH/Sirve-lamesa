import { Component } from '@angular/core';

// Stub de Fase 0 (issue #4). Login de investigadores del issue #7:
// el panel de análisis exigirá esta sesión (ADR-0001).
@Component({
  selector: 'app-acceso-investigadores',
  standalone: true,
  template: `
    <main class="f0-stub">
      <h1>Acceso de investigadores</h1>
      <p>Pantalla en construcción — issue #7.</p>
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
export class AccesoInvestigadoresComponent {}
