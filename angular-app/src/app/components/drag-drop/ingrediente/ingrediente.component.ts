import { Component, ElementRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ingrediente } from '../../../services/game-data.service';
import { DragDropService } from '../../../services/drag-drop.service';

const DRAG_THRESHOLD_PX = 6;

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

  @ViewChild('foodRoot', { read: ElementRef }) foodRoot!: ElementRef<HTMLElement>;

  isDragging = false;
  private suppressNextClick = false;

  private pointerId = -1;
  private startClientX = 0;
  private startClientY = 0;
  private dragActive = false;
  private cloneEl: HTMLElement | null = null;
  /** Desfase puntero → esquina sup. izq. de la imagen, tomado en pointerdown (no al cruzar el umbral). */
  private grabOffsetX = 0;
  private grabOffsetY = 0;
  /** Tamaño del clon = rect de la img en pointerdown. */
  private cloneW = 0;
  private cloneH = 0;

  private readonly onMove = (e: PointerEvent) => this.handlePointerMove(e);
  private readonly onUp = (e: PointerEvent) => this.handlePointerUp(e);

  constructor(private dragDropService: DragDropService) {}

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;

    const host = this.foodRoot?.nativeElement;
    if (!host) return;

    this.pointerId = event.pointerId;
    this.startClientX = event.clientX;
    this.startClientY = event.clientY;
    this.dragActive = false;

    const img = host.querySelector('img');
    if (img) {
      const r = img.getBoundingClientRect();
      const px = Math.min(Math.max(event.clientX, r.left), r.right);
      const py = Math.min(Math.max(event.clientY, r.top), r.bottom);
      this.grabOffsetX = px - r.left;
      this.grabOffsetY = py - r.top;
      this.cloneW = r.width;
      this.cloneH = r.height;
    } else {
      this.grabOffsetX = 0;
      this.grabOffsetY = 0;
      this.cloneW = 0;
      this.cloneH = 0;
    }

    host.setPointerCapture(event.pointerId);
    host.addEventListener('pointermove', this.onMove);
    host.addEventListener('pointerup', this.onUp);
    host.addEventListener('pointercancel', this.onUp);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;

    const dx = event.clientX - this.startClientX;
    const dy = event.clientY - this.startClientY;

    if (!this.dragActive) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      event.preventDefault();
      this.beginDragVisual(event);
    }

    if (this.dragActive && this.cloneEl) {
      this.positionClone(event.clientX, event.clientY);
      this.updatePlateHover(event.clientX, event.clientY);
    }
  }

  private beginDragVisual(event: PointerEvent): void {
    const host = this.foodRoot.nativeElement;
    const img = host.querySelector('img');
    if (!img || this.cloneW <= 0 || this.cloneH <= 0) return;

    const clone = img.cloneNode(true) as HTMLImageElement;
    clone.classList.add('drag-ingredient-clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.alt = '';
    clone.draggable = false;
    clone.style.cssText = [
      'position:fixed',
      'margin:0',
      'padding:0',
      'opacity:1',
      'pointer-events:none',
      'z-index:2147483646',
      `width:${this.cloneW}px`,
      `height:${this.cloneH}px`,
      'object-fit:contain',
      'box-sizing:border-box',
      'filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.22)) drop-shadow(0 8px 16px rgba(0,0,0,0.35))',
      'will-change:left,top',
      'transform:none'
    ].join(';');

    document.body.appendChild(clone);
    this.cloneEl = clone;

    this.dragDropService.startDrag(this.ingrediente);
    this.ingredienteArrastrado.emit(this.ingrediente);

    this.dragActive = true;
    this.isDragging = true;
    document.body.classList.add('is-grabbing-drag');

    this.positionClone(event.clientX, event.clientY);
    this.updatePlateHover(event.clientX, event.clientY);
  }

  private positionClone(clientX: number, clientY: number): void {
    if (!this.cloneEl) return;
    const x = Math.round(clientX - this.grabOffsetX);
    const y = Math.round(clientY - this.grabOffsetY);
    this.cloneEl.style.left = `${x}px`;
    this.cloneEl.style.top = `${y}px`;
  }

  private updatePlateHover(clientX: number, clientY: number): void {
    const list = document.elementsFromPoint(clientX, clientY);
    let over = false;
    for (const node of list) {
      const el = node as HTMLElement;
      if (this.cloneEl && (el === this.cloneEl || this.cloneEl.contains(el))) continue;
      if (el.closest?.('[data-plato-drop-area]')) {
        over = true;
        break;
      }
    }
    this.dragDropService.setPointerOverPlate(over);
  }

  private handlePointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;

    const host = this.foodRoot?.nativeElement;
    if (host) {
      try {
        host.releasePointerCapture(this.pointerId);
      } catch {
        /* ignore */
      }
      host.removeEventListener('pointermove', this.onMove);
      host.removeEventListener('pointerup', this.onUp);
      host.removeEventListener('pointercancel', this.onUp);
    }

    if (this.dragActive) {
      this.dragDropService.emitPointerDragEnd(event.clientX, event.clientY);
      this.suppressNextClick = true;
    }

    this.teardownDragVisual();
    this.dragDropService.setPointerOverPlate(false);
    if (this.dragActive) {
      this.dragDropService.clear();
    }

    this.dragActive = false;
    this.isDragging = false;
    this.pointerId = -1;
    document.body.classList.remove('is-grabbing-drag');
  }

  private teardownDragVisual(): void {
    if (this.cloneEl?.parentNode) {
      this.cloneEl.parentNode.removeChild(this.cloneEl);
    }
    this.cloneEl = null;
  }

  onRootClick(event: MouseEvent): void {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.onSeleccionar();
  }

  onSeleccionar(): void {
    this.ingredienteSeleccionado.emit(this.ingrediente);
  }

  getImagePath(): string {
    return `assets/images/ingredientes/${this.ingrediente.imagen}`;
  }
}
