import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponenteServido } from '../../../models/decision.model';
import { Ingrediente } from '../../../services/game-data.service';
import { DragDropService } from '../../../services/drag-drop.service';

export interface IngredienteEnPlato {
  ingrediente: Ingrediente;
  cantidad: number;
  unidad: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface DropPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-plato-drop-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plato-drop-zone.component.html',
  styleUrls: ['./plato-drop-zone.component.scss']
})
export class PlatoDropZoneComponent implements OnChanges {
  @Input() ingredientesEnPlato: IngredienteEnPlato[] = [];
  @Input() personajeActual: any = null; // Personaje actual para mostrar su imagen
  @Output() ingredienteAgregado = new EventEmitter<IngredienteEnPlato>();
  @Output() ingredienteEliminado = new EventEmitter<number>();
  @Output() platoServido = new EventEmitter<ComponenteServido[]>();
  @Output() limpiarSolicitado = new EventEmitter<void>();

  @ViewChild('plateArea') plateAreaRef?: ElementRef<HTMLDivElement>;
  @ViewChild('plateImage') plateImageRef?: ElementRef<HTMLImageElement>;

  mesaImagen = 'assets/images/ingredientes/mesa.png';
  mantelImagen = 'assets/images/ingredientes/mantel.png';
  platoImagen = 'assets/images/ingredientes/plato.png';
  isDragOver = false;

  get personajeImagen(): string | null {
    if (this.personajeActual?.imagen) {
      return `assets/images/ingredientes/${this.personajeActual.imagen}`;
    }
    // Por ahora usar el niño por defecto
    return 'assets/images/ingredientes/niño.png';
  }

  private readonly tamanosVisuales: Record<string, number> = {
    'Pollo': 50,
    'Bistecs': 55,
    'Huevo': 45,
    'Tocineta': 45,
    'Arroz': 45,
    'Plátano': 48,
    'Papa': 45,
    'Pasta': 48,
    'Granos': 45,
    'Pan': 50,
    'Tomate': 38,
    'Lechuga': 42,
    'Brócoli': 45,
    'Zanahoria': 48,
    'Pepino': 40,
    'Naranja': 45,
    'Lechosa': 50,
    'Cambur': 45,
    'Fresa': 40,
    'Piña': 55
  };

  constructor(private dragDropService: DragDropService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Este método se llama cuando cambian los @Input()
    // Angular detectará automáticamente los cambios en ingredientesEnPlato
  }

  trackByIndex(index: number): number {
    return index;
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
    const plateArea = this.plateAreaRef?.nativeElement;
    const plateContainer = plateArea?.closest('.plate-container') as HTMLElement;
    if (plateArea) {
      plateArea.classList.add('dragging-active');
    }
    if (plateContainer) {
      plateContainer.classList.add('dragging-active');
    }
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const plateArea = this.plateAreaRef?.nativeElement;
    const plateContainer = plateArea?.closest('.plate-container') as HTMLElement;
    if (plateArea) {
      plateArea.classList.remove('dragging-active');
    }
    if (plateContainer) {
      plateContainer.classList.remove('dragging-active');
    }
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const plateArea = this.plateAreaRef?.nativeElement;
    const plateContainer = plateArea?.closest('.plate-container') as HTMLElement;
    if (plateArea) {
      plateArea.classList.remove('dragging-active');
    }
    if (plateContainer) {
      plateContainer.classList.remove('dragging-active');
    }

    const ingrediente = this.dragDropService.getDraggedIngredient();
    if (!ingrediente) {
      console.warn('No hay ingrediente en el servicio de drag-drop');
      return;
    }

    const pointer = { x: event.clientX, y: event.clientY };
    const posicionManual = this.calcularPosicionManual(pointer, ingrediente);

    if (posicionManual) {
      this.tryAgregarIngrediente(ingrediente, null, true, posicionManual);
    } else {
      console.warn('No se pudo calcular la posición manual');
    }

    this.dragDropService.clear();
  }

  tryAgregarIngrediente(
    ingrediente: Ingrediente,
    dropPoint?: DropPoint | null,
    preferDropPoint = false,
    overridePosition?: { x: number; y: number }
  ): void {
    const nuevo = this.crearIngredienteEnPlato(
      ingrediente,
      dropPoint || undefined,
      preferDropPoint,
      overridePosition
    );
    if (nuevo) {
      this.ingredienteAgregado.emit(nuevo);
    }
  }

  crearIngredienteEnPlato(
    ingrediente: Ingrediente,
    dropPoint?: DropPoint,
    preferDropPoint = false,
    fixedPosition?: { x: number; y: number }
  ): IngredienteEnPlato | null {
    const plateRect = this.getPlateRect();
    if (!plateRect) {
      return null;
    }

    const visualSize = this.getVisualSize(ingrediente);
    const position = fixedPosition
      ? fixedPosition
      : this.obtenerPosicionDisponible(plateRect, visualSize, dropPoint, preferDropPoint);

    if (!position) {
      return null;
    }

    return {
      ingrediente,
      cantidad: ingrediente.porcionDefault,
      unidad: ingrediente.unidad,
      x: position.x,
      y: position.y,
      size: visualSize,
      rotation: this.getRandomRotation()
    };
  }

  eliminarIngrediente(index: number): void {
    this.ingredienteEliminado.emit(index);
  }

  onLimpiarPlato(): void {
    this.limpiarSolicitado.emit();
  }

  get cantidadTotal(): number {
    return this.ingredientesEnPlato.reduce((total, item) => {
      if (item.unidad === 'gramos') {
        return total + item.cantidad;
      }

      if (item.unidad === 'unidad' || item.unidad === 'unidades') {
        const pesosPorUnidad: { [key: string]: number } = {
          'Huevo': 50,
          'Naranja': 150,
          'Cambur': 120
        };
        const pesoPorUnidad = pesosPorUnidad[item.ingrediente.nombre] || 100;
        return total + (item.cantidad * pesoPorUnidad);
      }

      if (item.unidad === 'rebanadas') {
        const pesosPorRebanada: { [key: string]: number } = {
          'Pan': 30,
          'Tomate': 25,
          'Lechosa': 80,
          'Piña': 60
        };
        const pesoPorRebanada = pesosPorRebanada[item.ingrediente.nombre] || 30;
        return total + (item.cantidad * pesoPorRebanada);
      }

      return total;
    }, 0);
  }

  servirPlato(): void {
    if (!this.ingredientesEnPlato.length) {
      return;
    }

    const componentesServidos: ComponenteServido[] = this.ingredientesEnPlato.map(item => {
      let cantidadEnGramos = item.cantidad;

      if (item.unidad !== 'gramos') {
        if (item.unidad === 'unidad' || item.unidad === 'unidades') {
          const pesosPorUnidad: { [key: string]: number } = {
            'Huevo': 50,
            'Naranja': 150,
            'Cambur': 120
          };
          cantidadEnGramos = item.cantidad * (pesosPorUnidad[item.ingrediente.nombre] || 100);
        } else if (item.unidad === 'rebanadas') {
          const pesosPorRebanada: { [key: string]: number } = {
            'Pan': 30,
            'Tomate': 25,
            'Lechosa': 80,
            'Piña': 60
          };
          cantidadEnGramos = item.cantidad * (pesosPorRebanada[item.ingrediente.nombre] || 30);
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

  private getPlateRect(): DOMRect | null {
    const element = this.plateImageRef?.nativeElement || this.plateAreaRef?.nativeElement;
    return element?.getBoundingClientRect() || null;
  }

  private obtenerPosicionDisponible(
    plateRect: DOMRect,
    size: number,
    dropPoint?: DropPoint,
    preferDropPoint = false
  ): { x: number; y: number } | null {
    const radius = Math.min(plateRect.width, plateRect.height) / 2 * 0.85;

    const preferred = dropPoint ? this.convertToPercentage(dropPoint, plateRect, radius, size) : null;
    if (preferred) {
      return preferred;
    }

    if (dropPoint && preferDropPoint) {
      return null;
    }

    // Intento en espiral
    const centerX = plateRect.width / 2;
    const centerY = plateRect.height / 2;
    const angleStep = Math.PI / 12;
    const radiusStep = 20;
    const maxRadius = radius - size / 2;

    for (let r = 20; r <= maxRadius; r += radiusStep) {
      for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        const percent = this.validateAndConvertPosition(x, y, plateRect, radius, size);
        if (percent) {
          return percent;
        }
      }
    }

    // Intentos aleatorios
    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const randomRadius = Math.random() * (radius - size / 2);
      const x = (plateRect.width / 2) + randomRadius * Math.cos(angle);
      const y = (plateRect.height / 2) + randomRadius * Math.sin(angle);
      const percent = this.validateAndConvertPosition(x, y, plateRect, radius, size);
      if (percent) {
        return percent;
      }
    }

    return null;
  }

  private calcularPosicionManual(
    pointer: { x: number; y: number } | null,
    ingrediente: Ingrediente
  ): { x: number; y: number } | null {
    if (!pointer) {
      return null;
    }

    const plateRect = this.getPlateRect();
    if (!plateRect) {
      return null;
    }

    const dropX = pointer.x - plateRect.left;
    const dropY = pointer.y - plateRect.top;

    // Para drops manuales, aceptar cualquier posición dentro del área del plato
    // sin validar radio circular ni solapamiento
    if (dropX >= 0 && dropX <= plateRect.width && dropY >= 0 && dropY <= plateRect.height) {
      return {
        x: (dropX / plateRect.width) * 100,
        y: (dropY / plateRect.height) * 100
      };
    }

    return null;
  }

  private convertToPercentage(dropPoint: DropPoint, plateRect: DOMRect, radius: number, size: number) {
    const xRelative = dropPoint.x - plateRect.left;
    const yRelative = dropPoint.y - plateRect.top;
    return this.validateAndConvertPosition(xRelative, yRelative, plateRect, radius, size);
  }

  private validateAndConvertPosition(
    x: number,
    y: number,
    plateRect: DOMRect,
    radius: number,
    size: number,
    enforceSeparation = false
  ) {
    const centerX = plateRect.width / 2;
    const centerY = plateRect.height / 2;
    const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

    // Solo validar que esté dentro del radio del plato
    if (distanceFromCenter + size / 2 > radius) {
      return null;
    }

    // Para drops manuales (drag & drop), no validar solapamiento para mayor fluidez
    // Solo validar solapamiento si se solicita explícitamente (para posiciones automáticas)
    if (enforceSeparation && this.seSuperponeConExistentes(x, y, plateRect, size)) {
      return null;
    }

    return {
      x: (x / plateRect.width) * 100,
      y: (y / plateRect.height) * 100
    };
  }

  private seSuperponeConExistentes(x: number, y: number, plateRect: DOMRect, newSize: number): boolean {
    // Permitir hasta 40% de solapamiento para hacer más fácil colocar comida
    const maxOverlap = 0.4;
    return this.ingredientesEnPlato.some(item => {
      const existingX = (item.x / 100) * plateRect.width;
      const existingY = (item.y / 100) * plateRect.height;
      const distance = Math.hypot(x - existingX, y - existingY);
      const minDistance = (newSize / 2) + (item.size / 2) - (Math.min(newSize, item.size) * maxOverlap);
      return distance < minDistance;
    });
  }

  private getRandomRotation(): number {
    return Math.floor(Math.random() * 30) - 15;
  }

  private getVisualSize(ingrediente: Ingrediente): number {
    const base = this.tamanosVisuales[ingrediente.nombre] ?? 45;
    return Math.round(base * 2.5);
  }
}
