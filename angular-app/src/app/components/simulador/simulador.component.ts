import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { ConfirmacionModalComponent } from '../confirmacion-modal/confirmacion-modal.component';
import {
  AlimentoCatalogo,
  PayloadEnvio,
  Personaje
} from '../../models/contrato';
import { Asignacion, AsignacionService } from '../../services/asignacion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { EnvioService, FalloEnvio } from '../../services/envio.service';
import { ParticipanteService } from '../../services/participante.service';
import { PlatoService } from '../../services/plato.service';
import { AvatarPersonajeComponent } from './avatar-personaje/avatar-personaje.component';
import { BannerContextoComponent } from './banner-contexto/banner-contexto.component';
import { ContenedorBebidaComponent } from './contenedor-bebida/contenedor-bebida.component';
import { MenuLateralComponent } from './menu-lateral/menu-lateral.component';
import { PlatoCanvasComponent } from './plato-canvas/plato-canvas.component';

const MENSAJE_PLATO_VACIO = 'Por favor, sirve los alimentos en el plato antes de continuar';

/**
 * Pantalla de servicio (Vía B, issues #16–#22).
 *
 * Orquesta banner, avatar, menú, plato y bebida sobre una sola asignación, y
 * entrega el payload al EnvioService de la Vía A. El modal de confirmación se
 * instancia aquí; su interior no se toca.
 */
@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [
    CommonModule,
    BannerContextoComponent,
    AvatarPersonajeComponent,
    PlatoCanvasComponent,
    ContenedorBebidaComponent,
    MenuLateralComponent,
    ConfirmacionModalComponent
  ],
  templateUrl: './simulador.component.html',
  styleUrls: ['./simulador.component.scss']
})
export class SimuladorComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly asignacionService = inject(AsignacionService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly participanteService = inject(ParticipanteService);
  private readonly envio = inject(EnvioService);
  readonly plato = inject(PlatoService);

  asignacion: Asignacion | null = null;
  alimentos: AlimentoCatalogo[] = [];
  cargando = true;
  errorCarga = '';
  alertaVacio = '';
  mostrandoModal = false;
  soloReintento = false;

  ngOnInit(): void {
    const datos = this.participanteService.getDatosRegistro();

    if (!datos) {
      if (this.envio.hayEnvioPendiente()) {
        this.soloReintento = true;
        this.cargando = false;
        return;
      }
      void this.router.navigate(['/registro']);
      return;
    }

    this.asignacionService
      .obtenerAsignacion()
      .pipe(
        switchMap(asignacion => {
          this.asignacion = asignacion;
          return this.catalogoService.obtenerCatalogo(asignacion.momento_dia);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: alimentos => {
          this.alimentos = alimentos;
          this.plato.registrarCatalogo(alimentos);
          this.plato.iniciarTarea();
          this.cargando = false;
        },
        error: err => {
          this.errorCarga = err instanceof Error ? err.message : 'No se pudo preparar la simulación.';
          this.cargando = false;
        }
      });
  }

  get personaje(): Personaje | null {
    return this.asignacion?.personaje ?? null;
  }

  get porcionesPorId(): ReadonlyMap<number, number> {
    const mapa = new Map<number, number>();
    for (const item of this.plato.items()) {
      mapa.set(item.alimento_id, item.porciones);
    }
    const bebida = this.plato.bebida();
    if (bebida) {
      mapa.set(bebida.alimento.id, bebida.porciones);
    }
    return mapa;
  }

  get isSubmitting(): boolean {
    return this.envio.isSubmitting;
  }

  get errorEnvio(): FalloEnvio | null {
    return this.envio.errorEnvio;
  }

  agregar(alimento: AlimentoCatalogo): void {
    this.alertaVacio = '';
    this.plato.agregar(alimento);
  }

  quitar(alimento: AlimentoCatalogo): void {
    this.plato.quitar(alimento);
  }

  onCambioPestana(grupo: string): void {
    this.plato.registrarCambioPestana(grupo);
  }

  finalizar(): void {
    if (this.plato.estaVacio) {
      this.alertaVacio = MENSAJE_PLATO_VACIO;
      return;
    }
    this.alertaVacio = '';
    this.mostrandoModal = true;
  }

  onCancelarModal(): void {
    this.mostrandoModal = false;
  }

  onConfirmarEnvio(): void {
    const payload = this.compilarPayload();
    if (!payload) {
      this.mostrandoModal = false;
      return;
    }

    this.envio.enviar(payload).subscribe({
      next: () => {
        this.asignacionService.limpiar();
        void this.router.navigate(['/salida']);
      },
      error: () => {
        this.mostrandoModal = false;
      }
    });
  }

  reintentar(): void {
    this.envio.reintentar().subscribe({
      next: () => {
        this.asignacionService.limpiar();
        void this.router.navigate(['/salida']);
      }
    });
  }

  private compilarPayload(): PayloadEnvio | null {
    const participante = this.participanteService.getDatosRegistro();
    const asignacion = this.asignacion;
    if (!participante || !asignacion) {
      return null;
    }

    const resultado = this.plato.compilarResultado();
    const { personaje, momento_dia } = asignacion;

    return {
      participante,
      sesion: {
        dispositivo: 'web',
        navegador: navigator.userAgent,
        resolucion_pantalla: `${window.screen.width}x${window.screen.height}`,
        fecha_inicio: this.plato.fechaInicio
      },
      contexto_asignado: {
        personaje_id: personaje.id,
        personaje_slug: personaje.slug,
        personaje_nombre: personaje.nombre,
        personaje_perfil_edad: personaje.perfil_edad,
        personaje_edad_rango: personaje.edad_rango,
        personaje_genero: personaje.genero,
        momento_dia
      },
      conducta: {
        tiempo_decision_segundos: this.plato.tiempoDecisionSegundos(),
        secuencia_clics: this.plato.secuenciaClics()
      },
      resultado_plato: resultado
    };
  }
}
