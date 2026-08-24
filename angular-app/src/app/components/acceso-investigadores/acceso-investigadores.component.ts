import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InvestigadorService } from '../../services/investigador.service';

// Vía A (issue #7): acceso al panel de análisis con sesión real de Supabase Auth.
// El participante no la ve en el flujo; el equipo entra por el botón Admin del
// registro o por URL directa. Las cuentas las da de alta el equipo (migración 013).
@Component({
  selector: 'app-acceso-investigadores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
