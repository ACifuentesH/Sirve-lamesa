import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ingrediente } from '../../services/game-data.service';
import { IngredienteComponent } from '../drag-drop/ingrediente/ingrediente.component';

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [CommonModule, IngredienteComponent],
  templateUrl: './ingredientes.component.html',
  styleUrls: ['./ingredientes.component.scss']
})
export class IngredientesComponent {
  @Input() ingredientes: Ingrediente[] = [];
  @Input() escenarioActual: 'desayuno' | 'almuerzo' | 'cena' = 'desayuno';
  @Output() ingredienteSeleccionado = new EventEmitter<Ingrediente>();

  /** Orden fijo de bloques en el panel (todas visibles a la vez). */
  categorias = [
    { id: 'proteina', nombre: 'Proteínas', icono: '🥩' },
    { id: 'carbohidrato', nombre: 'Carbohidratos', icono: '🍞' },
    { id: 'vegetal', nombre: 'Vegetales', icono: '🥕' },
    { id: 'fruta', nombre: 'Frutas', icono: '🍎' }
  ];

  getIngredientesPorCategoria(categoriaId: string): Ingrediente[] {
    const id = categoriaId.trim().toLowerCase();
    return this.ingredientes.filter(i => (i.categoria || '').trim().toLowerCase() === id);
  }

  onIngredienteArrastrado(ingrediente: Ingrediente): void {
    console.log('Ingrediente arrastrado:', ingrediente.nombre);
  }

  onIngredienteSeleccionado(ingrediente: Ingrediente): void {
    this.ingredienteSeleccionado.emit(ingrediente);
  }
}
