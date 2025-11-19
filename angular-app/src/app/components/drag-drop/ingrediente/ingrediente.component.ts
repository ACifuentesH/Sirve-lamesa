import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Ingrediente } from '../../../services/game-data.service';

@Component({
  selector: 'app-ingrediente',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './ingrediente.component.html',
  styleUrls: ['./ingrediente.component.scss']
})
export class IngredienteComponent {
  @Input() ingrediente!: Ingrediente;
  @Output() ingredienteArrastrado = new EventEmitter<Ingrediente>();

  onDragStart(): void {
    this.ingredienteArrastrado.emit(this.ingrediente);
  }

  getImagePath(): string {
    return `assets/images/ingredientes/${this.ingrediente.imagen}`;
  }
}
