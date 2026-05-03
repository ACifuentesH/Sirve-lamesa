import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Ingrediente } from './game-data.service';

/** Emite al soltar un arrastre por puntero (coordenadas de pantalla). */
export interface PointerDragEndPayload {
  clientX: number;
  clientY: number;
}

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  private draggedIngredient: Ingrediente | null = null;

  /** Fin de arrastre por puntero (suscribe la zona de drop). */
  readonly pointerDragEnd$ = new Subject<PointerDragEndPayload>();

  /** Indica si el puntero está sobre el área del plato (feedback visual). */
  private readonly pointerOverPlate = new BehaviorSubject(false);
  readonly pointerOverPlate$ = this.pointerOverPlate.asObservable();

  startDrag(ingrediente: Ingrediente): void {
    this.draggedIngredient = ingrediente;
  }

  getDraggedIngredient(): Ingrediente | null {
    return this.draggedIngredient;
  }

  setPointerOverPlate(over: boolean): void {
    if (this.pointerOverPlate.value !== over) {
      this.pointerOverPlate.next(over);
    }
  }

  emitPointerDragEnd(clientX: number, clientY: number): void {
    this.pointerDragEnd$.next({ clientX, clientY });
  }

  clear(): void {
    this.draggedIngredient = null;
    this.pointerOverPlate.next(false);
  }
}
