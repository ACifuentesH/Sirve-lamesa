import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InvestigadorService } from '../../services/investigador.service';

// Vía A (issue #7): acceso al panel de análisis con sesión real de Supabase Auth.
// Sustituye al stub de la Fase 0. No es una pantalla para el participante: se llega
// solo por URL directa, y las cuentas las da de alta el equipo (migración 013).
@Component({
  selector: 'app-acceso-investigadores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './acceso-investigadores.component.html',
  styleUrls: ['./acceso-investigadores.component.scss']
})
export class AccesoInvestigadoresComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly investigador = inject(InvestigadorService);
  private readonly router = inject(Router);

  readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  enviando = false;
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    // Con la sesión ya iniciada la pantalla no aporta nada: al panel directo.
    if (await this.investigador.estaAutorizado()) {
      await this.router.navigate(['/investigadores']);
    }
  }

  async acceder(): Promise<void> {
    if (this.formulario.invalid || this.enviando) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.error = null;

    const { email, password } = this.formulario.getRawValue();
    const resultado = await this.investigador.iniciarSesion(email.trim(), password);

    this.enviando = false;

    if (resultado.ok) {
      await this.router.navigate(['/investigadores']);
      return;
    }

    this.error = resultado.mensaje;
    this.formulario.patchValue({ password: '' });
  }
}
