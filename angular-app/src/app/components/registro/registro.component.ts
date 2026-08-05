import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Etnia, Genero, NivelEstudios, Participante } from '../../models/contrato';
import { REGIONES } from '../../shared/regiones.const';
import { ParticipanteService } from '../../services/participante.service';

// Vía A (issue #8): registro sociodemográfico del Módulo 2. Los datos quedan
// en memoria (ParticipanteService); el envío único ocurre al final del flujo.
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly participanteService = inject(ParticipanteService);

  readonly regiones = REGIONES;

  readonly generos: ReadonlyArray<{ value: Genero; label: string }> = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'no_binario', label: 'Otro o no binario' },
    { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' }
  ];

  readonly nivelesEstudios: ReadonlyArray<{ value: NivelEstudios; label: string }> = [
    { value: 'pregrado_curso', label: 'Pregrado en curso' },
    { value: 'pregrado_completo', label: 'Pregrado completo' },
    { value: 'posgrado', label: 'Posgrado' },
    { value: 'otro', label: 'Otro' }
  ];

  readonly etnias: ReadonlyArray<{ value: Etnia; label: string }> = [
    { value: 'latino_hispano', label: 'Latino o Hispano' },
    { value: 'afrodescendiente', label: 'Afrodescendiente' },
    { value: 'indigena', label: 'Indígena' },
    { value: 'blanco', label: 'Blanco' },
    { value: 'otro', label: 'Otro' }
  ];

  readonly form = this.fb.group({
    edad: [null as number | null, [Validators.required, Validators.min(16), Validators.max(99)]],
    peso_kg: [null as number | null, [Validators.required, Validators.min(30), Validators.max(250)]],
    altura_cm: [null as number | null, [Validators.required, Validators.min(100), Validators.max(230)]],
    genero: [null as Genero | null, Validators.required],
    nivel_estudios: [null as NivelEstudios | null, Validators.required],
    semestre_o_anio: this.fb.control<string>({ value: '', disabled: true }),
    etnia: [null as Etnia | null, Validators.required],
    region_origen: [null as string | null, Validators.required],
    region_residencia: [null as string | null, Validators.required],
    consentimiento_informado: [false, Validators.requiredTrue]
  });

  constructor() {
    // Validador condicional: el semestre solo existe (y obliga) en pregrado en curso.
    this.form.get('nivel_estudios')!.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(nivel => {
        const semestre = this.form.get('semestre_o_anio')!;
        if (nivel === 'pregrado_curso') {
          semestre.enable();
          semestre.setValidators([Validators.required, Validators.maxLength(40)]);
        } else {
          semestre.clearValidators();
          semestre.reset('');
          semestre.disable();
        }
        semestre.updateValueAndValidity();
      });
  }

  get muestraSemestre(): boolean {
    return this.form.get('nivel_estudios')!.value === 'pregrado_curso';
  }

  esInvalido(nombre: string): boolean {
    const control = this.form.get(nombre)!;
    return control.invalid && control.touched;
  }

  continuar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: Omit<Participante, 'id'> = {
      edad: v.edad!,
      peso_kg: Math.round(v.peso_kg! * 10) / 10,
      altura_cm: v.altura_cm!,
      genero: v.genero!,
      nivel_estudios: v.nivel_estudios!,
      semestre_o_anio: v.nivel_estudios === 'pregrado_curso' ? (v.semestre_o_anio || null) : null,
      etnia: v.etnia!,
      region_origen: v.region_origen!,
      region_residencia: v.region_residencia!,
      consentimiento_informado: v.consentimiento_informado!
    };
    this.participanteService.setDatosRegistro(datos);
    this.router.navigate(['/onboarding']);
  }
}
