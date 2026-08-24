import { Component, OnInit, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ParticipanteService } from '../../services/participante.service';

// Vía A (issue #11): pantalla final sostenida con el texto literal del Anexo E.
// Reemplaza el cierre abrupto del flujo viejo (auto-redirect de 3 s): estática,
// sin temporizador; el participante decide cuándo salir.
@Component({
  selector: 'app-salida',
  standalone: true,
  templateUrl: './salida.component.html',
  styleUrls: ['./salida.component.scss']
})
export class SalidaComponent implements OnInit {
  private readonly participanteService = inject(ParticipanteService);

  ngOnInit(): void {
    // Al montarse se limpia el estado de la sesión: si el participante pulsa
    // "atrás", el flujo ya no tiene datos con los que reabrir el plato enviado.
    this.participanteService.limpiar();
  }

  regresarALaFundacion(): void {
    // PENDIENTE (issue #1): mientras la Fundación no entregue la URL definitiva,
    // environment.urlFundacion queda vacío y el botón no navega a ningún lado.
    if (environment.urlFundacion) {
      window.location.href = environment.urlFundacion;
    }
  }
}
