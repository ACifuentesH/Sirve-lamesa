import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { investigadorGuard } from './guards/investigador.guard';

// Congelado tras la Fase 0 (0.6, issue #4): este archivo se editó una sola vez con
// todas las rutas; cambios posteriores solo por acuerdo de ambas vías.
// Excepción acordada (issue #34): renombre de /admin a /investigadores. Se mantiene
// una redirección explícita desde /admin -- sin ella, el wildcard de abajo manda
// cualquier marcador o enlace viejo a /registro sin explicación, un 404 silencioso.
// Excepción acordada (issue #24): se retiró /juego con el módulo legacy que servía.
// Aquí no se deja redirección: /juego era la pantalla vieja de arrastrar y soltar, no
// un renombre de la nueva, y mandar a un participante desde un enlace viejo a mitad
// del flujo nuevo lo metería en la tarea sin registro ni onboarding. El wildcard lo
// devuelve al principio, que es el único punto de entrada correcto.
const routes: Routes = [
  {
    path: '',
    redirectTo: 'registro',
    pathMatch: 'full'
  },
  {
    // El panel expone el estudio completo: exige sesión de investigador (issue #7).
    path: 'investigadores',
    loadChildren: () => import('./components/investigador/investigador.module').then(m => m.InvestigadorModule),
    canActivate: [investigadorGuard]
  },
  {
    // Ruta vieja (issue #34): puede seguir en marcadores o notas del equipo.
    path: 'admin',
    redirectTo: 'investigadores'
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
