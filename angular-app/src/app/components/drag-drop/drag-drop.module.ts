import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

// Standalone Components (imported, not declared)
import { IngredienteComponent } from './ingrediente/ingrediente.component';
import { PlatoDropZoneComponent } from './plato-drop-zone/plato-drop-zone.component';

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    IngredienteComponent,
    PlatoDropZoneComponent
  ],
  exports: [
    IngredienteComponent,
    PlatoDropZoneComponent
  ]
})
export class DragDropComponentsModule { }
