import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createForm();
  }

  createForm(): void {
    this.loginForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      sexo: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(120)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';

    const formData = {
      nombres: this.loginForm.value.nombres,
      edad: parseInt(this.loginForm.value.edad),
      sexo: this.mapSexo(this.loginForm.value.sexo),
      consentimiento_informado: true
    };

    // Crear participante
    this.apiService.crearParticipante(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Guardar datos del participante
          this.authService.setParticipante(response.data);

          // Iniciar sesión
          this.iniciarSesion(response.data.pk_participante);
        }
      },
      error: (error) => {
        console.error('Error al crear participante:', error);
        this.error = 'Error al registrar participante. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  private iniciarSesion(participanteId: number): void {
    const sessionData = {
      participante_id: participanteId,
      dispositivo: 'web',
      navegador: navigator.userAgent, // Campo TEXT sin límite
      resolucion_pantalla: `${window.screen.width}x${window.screen.height}`
    };

    this.apiService.iniciarSesion(sessionData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Guardar sesión
          this.authService.setSesion(response.data);

          // Navegar al juego
          this.router.navigate(['/juego']);
        }
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
        this.error = 'Error al iniciar sesión. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  private mapSexo(sexo: string): string {
    const mapping: { [key: string]: string } = {
      'masculino': 'M',
      'femenino': 'F',
      'otro': 'Otro'
    };
    return mapping[sexo] || sexo;
  }

  // Getters para validación en template
  get nombres() { return this.loginForm.get('nombres'); }
  get sexo() { return this.loginForm.get('sexo'); }
  get edad() { return this.loginForm.get('edad'); }
}
