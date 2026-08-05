import { Injectable } from '@angular/core';
import { Participante } from '../models/contrato';

// Vía A (issue #8): estado en memoria del registro sociodemográfico.
// El envío único a la BD ocurre al final del flujo (§6.2) — este servicio
// no toca la red ni localStorage; recargar la página reinicia el registro.
@Injectable({ providedIn: 'root' })
export class ParticipanteService {
  private datos: Omit<Participante, 'id'> | null = null;

  setDatosRegistro(datos: Omit<Participante, 'id'>): void {
    this.datos = datos;
  }

  getDatosRegistro(): Omit<Participante, 'id'> | null {
    return this.datos;
  }

  limpiar(): void {
    this.datos = null;
  }
}
