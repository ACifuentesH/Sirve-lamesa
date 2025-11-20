import { Injectable } from '@angular/core';
import { Ingrediente } from './game-data.service';

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  private draggedIngredient: Ingrediente | null = null;

  startDrag(ingrediente: Ingrediente): void {
    this.draggedIngredient = ingrediente;
  }

  getDraggedIngredient(): Ingrediente | null {
    return this.draggedIngredient;
  }

  clear(): void {
    this.draggedIngredient = null;
  }
}

