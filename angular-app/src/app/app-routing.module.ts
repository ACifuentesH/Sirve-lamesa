import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { investigadorGuard } from './guards/investigador.guard';

// Congelado tras la Fase 0 (0.6, issue #4): este archivo se editó una sola vez con
// todas las rutas; cambios posteriores solo por acuerdo de ambas vías.
const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./components/login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'juego',
    loadChildren: () => import('./components/game/game.module').then(m => m.GameModule),
    canActivate: [AuthGuard]
  },
  {
    // El panel expone el estudio completo: exige sesión de investigador (issue #7).
    path: 'admin',
    loadChildren: () => import('./components/admin/admin.module').then(m => m.AdminModule),
    canActivate: [investigadorGuard]
  },
  // Flujo nuevo (stubs de Fase 0; cada vía implementa el suyo)
  {
    path: 'registro',
    loadComponent: () => import('./components/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./components/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'simulador',
    loadComponent: () => import('./components/simulador/simulador.component').then(m => m.SimuladorComponent)
  },
  {
    path: 'salida',
    loadComponent: () => import('./components/salida/salida.component').then(m => m.SalidaComponent)
  },
  {
    path: 'acceso-investigadores',
    loadComponent: () => import('./components/acceso-investigadores/acceso-investigadores.component').then(m => m.AccesoInvestigadoresComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
