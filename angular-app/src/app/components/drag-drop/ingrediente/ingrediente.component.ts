import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ingrediente } from '../../../services/game-data.service';
import { DragDropService } from '../../../services/drag-drop.service';

@Component({
  selector: 'app-ingrediente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingrediente.component.html',
  styleUrls: ['./ingrediente.component.scss']
})
export class IngredienteComponent {
  @Input() ingrediente!: Ingrediente;
  @Output() ingredienteArrastrado = new EventEmitter<Ingrediente>();
  @Output() ingredienteSeleccionado = new EventEmitter<Ingrediente>();
  isDragging = false;

  constructor(private dragDropService: DragDropService) {}

  onDragStart(event: DragEvent): void {
    this.isDragging = true;
    this.ingredienteArrastrado.emit(this.ingrediente);
    this.dragDropService.startDrag(this.ingrediente);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', String(this.ingrediente.id));

      const imgElement = (event.target as HTMLElement).querySelector('img');
      if (imgElement) {
        event.dataTransfer.setDragImage(imgElement, imgElement.width / 2, imgElement.height / 2);
      }
    }
  }

  onDragEnd(): void {
    this.isDragging = false;
    // No limpiar aquí, dejar que el drop zone lo haga después de procesar
  }

  onSeleccionar(): void {
    this.ingredienteSeleccionado.emit(this.ingrediente);
  }

  getImagePath(): string {
    return `assets/images/ingredientes/${this.ingrediente.imagen}`;
  }
}
