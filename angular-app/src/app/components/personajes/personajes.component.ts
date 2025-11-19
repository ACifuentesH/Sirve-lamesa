import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonajeSintetico } from '../../services/game-data.service';

@Component({
  selector: 'app-personajes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personajes.component.html',
  styleUrls: ['./personajes.component.scss']
})
export class PersonajesComponent {
  @Input() personajes: PersonajeSintetico[] = [];
  @Input() personajeActual: PersonajeSintetico | null = null;
  @Output() personajeSeleccionado = new EventEmitter<PersonajeSintetico>();

  seleccionarPersonaje(personaje: PersonajeSintetico): void {
    if (personaje.estado !== 'servido') {
      this.personajeSeleccionado.emit(personaje);
    }
  }

  getImagePath(imagen: string): string {
    return `assets/images/ingredientes/${imagen}`;
  }

  getEstadoClass(personaje: PersonajeSintetico): string {
    if (this.personajeActual?.id === personaje.id) {
      return 'activo';
    }
    return personaje.estado || 'pendiente';
  }

  getEstadoTexto(estado: string | undefined): string {
    const textos: { [key: string]: string } = {
      'pendiente': 'Por servir',
      'en_curso': 'Sirviendo...',
      'servido': 'Servido ✓'
    };
    return textos[estado || 'pendiente'];
  }
}
