import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Ingrediente } from '../../services/game-data.service';
import { IngredienteComponent } from '../drag-drop/ingrediente/ingrediente.component';

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [CommonModule, DragDropModule, IngredienteComponent],
  templateUrl: './ingredientes.component.html',
  styleUrls: ['./ingredientes.component.scss']
})
export class IngredientesComponent implements OnInit {
  @Input() ingredientes: Ingrediente[] = [];
  @Input() escenarioActual: 'desayuno' | 'almuerzo' | 'cena' = 'desayuno';
  @Output() ingredienteSeleccionado = new EventEmitter<Ingrediente>();

  categoriaSeleccionada = 'todos';
  ingredientesFiltrados: Ingrediente[] = [];

  // Categorías disponibles
  categorias = [
    { id: 'todos', nombre: 'Todos', icono: '🍽️' },
    { id: 'proteina', nombre: 'Proteínas', icono: '🥩' },
    { id: 'carbohidrato', nombre: 'Carbohidratos', icono: '🍞' },
    { id: 'vegetal', nombre: 'Vegetales', icono: '🥕' },
    { id: 'fruta', nombre: 'Frutas', icono: '🍎' }
  ];

  ngOnInit(): void {
    this.filtrarPorCategoria('todos');
  }

  filtrarPorCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;

    if (categoria === 'todos') {
      this.ingredientesFiltrados = this.ingredientes;
    } else {
      this.ingredientesFiltrados = this.ingredientes.filter(i => i.categoria === categoria);
    }
  }

  // Método para determinar qué ingredientes mostrar según el escenario
  getIngredientesParaEscenario(): Ingrediente[] {
    // Por ahora mostramos todos los ingredientes filtrados
    // En el futuro se podría filtrar por escenario específico
    return this.ingredientesFiltrados;
  }

  onIngredienteArrastrado(ingrediente: Ingrediente): void {
    // Este evento se puede usar para analytics o feedback visual
    console.log('Ingrediente arrastrado:', ingrediente.nombre);
  }

  onIngredienteSeleccionado(ingrediente: Ingrediente): void {
    this.ingredienteSeleccionado.emit(ingrediente);
  }
}
