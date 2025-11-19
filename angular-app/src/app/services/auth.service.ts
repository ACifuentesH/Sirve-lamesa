import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Participante {
  pk_participante: number;
  nombres: string;
  edad: number;
  sexo: string;
  peso_kg?: number;
  altura_cm?: number;
  imc?: number;
  lugar_nacimiento?: string;
  lugar_residencia?: string;
  ocupacion?: string;
  nivel_socioeconomico?: string;
  eat26_score?: number;
  eat26_data?: any;
  consentimiento_informado: boolean;
  fecha_registro: string;
}

export interface Sesion {
  pk_sesion: number;
  fk_participante: number;
  fecha_inicio: string;
  fecha_fin?: string;
  duracion_total_segundos?: number;
  estado: 'en_curso' | 'completada' | 'abandonada';
  dispositivo?: string;
  navegador?: string;
  resolucion_pantalla?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private participanteSubject = new BehaviorSubject<Participante | null>(null);
  private sesionSubject = new BehaviorSubject<Sesion | null>(null);

  public participante$ = this.participanteSubject.asObservable();
  public sesion$ = this.sesionSubject.asObservable();

  constructor() {
    // Cargar datos del localStorage si existen
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const participante = localStorage.getItem('participante');
    const sesion = localStorage.getItem('sesion');

    if (participante) {
      try {
        this.participanteSubject.next(JSON.parse(participante));
      } catch (e) {
        console.error('Error al parsear participante del localStorage:', e);
      }
    }

    if (sesion) {
      try {
        this.sesionSubject.next(JSON.parse(sesion));
      } catch (e) {
        console.error('Error al parsear sesión del localStorage:', e);
      }
    }
  }

  setParticipante(participante: Participante): void {
    localStorage.setItem('participante', JSON.stringify(participante));
    this.participanteSubject.next(participante);
  }

  setSesion(sesion: Sesion): void {
    localStorage.setItem('sesion', JSON.stringify(sesion));
    this.sesionSubject.next(sesion);
  }

  getParticipante(): Participante | null {
    return this.participanteSubject.value;
  }

  getSesion(): Sesion | null {
    return this.sesionSubject.value;
  }

  getParticipanteId(): number | null {
    const participante = this.getParticipante();
    return participante ? participante.pk_participante : null;
  }

  getSesionId(): number | null {
    const sesion = this.getSesion();
    return sesion ? sesion.pk_sesion : null;
  }

  isAuthenticated(): boolean {
    return !!(this.getParticipante() && this.getSesion());
  }

  clearSession(): void {
    localStorage.removeItem('participante');
    localStorage.removeItem('sesion');
    this.participanteSubject.next(null);
    this.sesionSubject.next(null);
  }

  updateSesionStatus(status: 'completada' | 'abandonada'): void {
    const sesion = this.getSesion();
    if (sesion) {
      sesion.estado = status;
      sesion.fecha_fin = new Date().toISOString();
      this.setSesion(sesion);
    }
  }
}
