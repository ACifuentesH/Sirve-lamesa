import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { InvestigadorComponent } from './investigador.component';

const routes: Routes = [
  {
    path: '',
    component: InvestigadorComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    InvestigadorComponent
  ]
})
export class InvestigadorModule { }
