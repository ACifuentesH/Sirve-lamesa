import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { InvestigadorService } from '../services/investigador.service';

// Vía A (issue #7): protege el panel de análisis.
//
// Antes /admin era una ruta abierta: cualquiera con la URL veía el panel y exportaba
// el estudio. El guard es la primera puerta, no la única: aunque alguien se la salte,
// el RLS no le entrega ni una fila sin un JWT autorizado.
export const investigadorGuard: CanActivateFn = async () => {
  const investigador = inject(InvestigadorService);
  const router = inject(Router);

  if (await investigador.estaAutorizado()) {
    return true;
  }

  return router.createUrlTree(['/acceso-investigadores']);
};
