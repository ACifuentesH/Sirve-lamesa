import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Vía A (issue #9): instrucciones previas a la tarea con el texto literal del
// Anexo D. El botón queda inerte los primeros 5 segundos con cuenta atrás
// visible, para forzar la lectura antes de avanzar (§ A4).
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  segundosRestantes = 5;

  get habilitado(): boolean {
    return this.segundosRestantes <= 0;
  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.segundosRestantes--;
      if (this.segundosRestantes <= 0) {
        this.detenerContador();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.detenerContador();
  }

  iniciarSimulacion(): void {
    // Doble seguro además de [disabled]: ni Enter ni un clic programático
    // pueden disparar la navegación durante el bloqueo.
    if (!this.habilitado) {
      return;
    }
    this.router.navigate(['/simulador']);
  }

  private detenerContador(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
