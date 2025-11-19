import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ComponenteServido } from '../../../models/decision.model';
import { Ingrediente } from '../../../services/game-data.service';

export interface IngredienteEnPlato {
  ingrediente: Ingrediente;
  cantidad: number;
  unidad: string;
}

@Component({
  selector: 'app-plato-drop-zone',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './plato-drop-zone.component.html',
  styleUrls: ['./plato-drop-zone.component.scss']
})
export class PlatoDropZoneComponent implements OnInit {
  @Input() ingredientesEnPlato: IngredienteEnPlato[] = [];
  @Output() ingredienteAgregado = new EventEmitter<IngredienteEnPlato>();
  @Output() ingredienteEliminado = new EventEmitter<number>();
  @Output() cantidadActualizada = new EventEmitter<{ index: number, cantidad: number }>();
  @Output() platoServido = new EventEmitter<ComponenteServido[]>();

  cantidadTotal = 0;
  platoImagen = 'assets/images/ingredientes/plato-grande.png';

  ngOnInit(): void {
    this.calcularCantidadTotal();
  }

  onDrop(event: CdkDragDrop<any>): void {
    if (event.previousContainer !== event.container) {
      const ingrediente = event.item.data as Ingrediente;

      // Verificar si el ingrediente ya está en el plato
      const existente = this.ingredientesEnPlato.find(i => i.ingrediente.id === ingrediente.id);

      if (!existente) {
        const nuevoIngrediente: IngredienteEnPlato = {
          ingrediente: ingrediente,
          cantidad: ingrediente.porcionDefault,
          unidad: ingrediente.unidad
        };

        this.ingredienteAgregado.emit(nuevoIngrediente);
        this.calcularCantidadTotal();
      }
    }
  }

  eliminarIngrediente(index: number): void {
    this.ingredienteEliminado.emit(index);
    this.calcularCantidadTotal();
  }

  actualizarCantidad(index: number, cantidad: number): void {
    if (cantidad >= 0) {
      this.cantidadActualizada.emit({ index, cantidad });
      this.calcularCantidadTotal();
    }
  }

  private calcularCantidadTotal(): void {
    this.cantidadTotal = this.ingredientesEnPlato.reduce((total, item) => {
      // Convertir todo a gramos para el total
      if (item.unidad === 'gramos') {
        return total + item.cantidad;
      } else if (item.unidad === 'unidad' || item.unidad === 'unidades') {
        // Estimar peso promedio por unidad (valores aproximados)
        const pesosPorUnidad: { [key: string]: number } = {
          'Huevo Frito': 50,
          'Bagel': 100,
          'Croissant': 60,
          'Muffin': 80,
          'Manzana': 180,
          'Naranja': 150,
          'Cambur': 120,
          'Durazno': 150,
          'Tomate Cherry': 20
        };
        const pesoPorUnidad = pesosPorUnidad[item.ingrediente.nombre] || 100;
        return total + (item.cantidad * pesoPorUnidad);
      } else if (item.unidad === 'rebanadas') {
        // Pan tostado: ~30g por rebanada
        return total + (item.cantidad * 30);
      }
      return total;
    }, 0);
  }

  servirPlato(): void {
    const componentesServidos: ComponenteServido[] = this.ingredientesEnPlato.map(item => {
      let cantidadEnGramos = item.cantidad;

      // Convertir a gramos si es necesario
      if (item.unidad !== 'gramos') {
        // Usar la misma lógica de conversión
        if (item.unidad === 'unidad' || item.unidad === 'unidades') {
          const pesosPorUnidad: { [key: string]: number } = {
            'Huevo Frito': 50,
            'Bagel': 100,
            'Croissant': 60,
            'Muffin': 80,
            'Manzana': 180,
            'Naranja': 150,
            'Cambur': 120,
            'Durazno': 150,
            'Tomate Cherry': 20
          };
          cantidadEnGramos = item.cantidad * (pesosPorUnidad[item.ingrediente.nombre] || 100);
        } else if (item.unidad === 'rebanadas') {
          cantidadEnGramos = item.cantidad * 30;
        }
      }

      return {
        componente_id: item.ingrediente.id,
        nombre: item.ingrediente.nombre,
        cantidad_gramos: cantidadEnGramos,
        imagen: item.ingrediente.imagen
      };
    });

    this.platoServido.emit(componentesServidos);
  }

  getImagePath(imagen: string): string {
    return `assets/images/ingredientes/${imagen}`;
  }
}
