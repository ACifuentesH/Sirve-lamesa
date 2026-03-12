import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { GameDataService, PersonajeSintetico, Ingrediente } from '../../services/game-data.service';
import { IngredienteEnPlato, PlatoDropZoneComponent } from '../drag-drop/plato-drop-zone/plato-drop-zone.component';
import { ComponenteServido } from '../../models/decision.model';
import { PersonajesComponent } from '../personajes/personajes.component';
import { IngredientesComponent } from '../ingredientes/ingredientes.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    PlatoDropZoneComponent,
    PersonajesComponent,
    IngredientesComponent
  ],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild(PlatoDropZoneComponent) platoDropZoneComponent?: PlatoDropZoneComponent;

  // Estado del juego
  escenarioActual: 'desayuno' | 'almuerzo' | 'cena' = 'desayuno';
  personajeActual: PersonajeSintetico | null = null;
  personajes: PersonajeSintetico[] = [];
  ingredientes: Ingrediente[] = [];
  ingredientesEnPlato: IngredienteEnPlato[] = [];

  // Flags
  loading = false;
  enviandoDecisiones = false;
  juegoCompletado = false;

  // Mensajes
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private apiService: ApiService,
    public authService: AuthService,  // Público para acceder desde template
    private gameDataService: GameDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    // Suscribirse a observables del servicio
    this.gameDataService.escenarioActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(escenario => this.escenarioActual = escenario);

    this.gameDataService.personajeActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(personaje => this.personajeActual = personaje);

    this.gameDataService.personajes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(personajes => this.personajes = personajes);

    this.gameDataService.ingredientes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ingredientes => this.ingredientes = ingredientes);

    // Inicializar juego (cargar datos desde API)
    this.inicializarJuego();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarJuego(): void {
    this.loading = true;

    // Cargar datos desde la API
    this.gameDataService.inicializarDatos().subscribe({
      next: () => {
        this.loading = false;

        // Resetear estados
        this.gameDataService.resetearJuego();

        // Cargar primer personaje
        const primerPersonaje = this.gameDataService.obtenerSiguientePersonaje();
        if (primerPersonaje) {
          this.seleccionarPersonaje(primerPersonaje);
        }
      },
      error: (error) => {
        console.error('Error al inicializar juego:', error);
        this.loading = false;
        this.mostrarError('Error al cargar los datos del juego. Por favor, recarga la página.');
      }
    });
  }

  seleccionarPersonaje(personaje: PersonajeSintetico): void {
    this.limpiarPlato();
    this.gameDataService.setPersonajeActual(personaje);
  }

  onPersonajeSeleccionado(personaje: PersonajeSintetico): void {
    this.seleccionarPersonaje(personaje);
  }

  onIngredienteAgregado(ingredienteEnPlato: IngredienteEnPlato): void {
    this.ingredientesEnPlato = [...this.ingredientesEnPlato, ingredienteEnPlato];
  }

  onIngredienteEliminado(index: number): void {
    this.ingredientesEnPlato = this.ingredientesEnPlato.filter((_, i) => i !== index);
  }

  onIngredienteSeleccionado(ingrediente: Ingrediente): void {
    const nuevo = this.platoDropZoneComponent?.crearIngredienteEnPlato(ingrediente);
    if (nuevo) {
      this.ingredientesEnPlato = [...this.ingredientesEnPlato, nuevo];
    }
  }

  onLimpiarPlato(): void {
    this.limpiarPlato();
  }

  onPlatoServido(componentesServidos: ComponenteServido[]): void {
    if (!this.personajeActual) return;

    // Calcular tiempo de decisión
    const tiempoDecision = this.gameDataService.calcularTiempoDecision();

    // Crear decisión
    const sesionId = this.authService.getSesionId();
    if (!sesionId) {
      this.mostrarError('Error: No se encontró sesión activa');
      return;
    }

    const decision = {
      sesion_id: sesionId,
      escenario: this.escenarioActual,
      personaje_tipo: this.personajeActual.tipo,
      personaje_edad_rango: this.personajeActual.edad_rango,
      personaje_sexo: this.personajeActual.sexo,
      personaje_id: this.personajeActual.id,
      componentes_servidos: componentesServidos,
      tiempo_decision_ms: tiempoDecision,
      orden_servicio: this.gameDataService.getOrdenServicioActual()
    };

    // Guardar decisión inmediatamente en la base de datos
    this.enviandoDecisiones = true;
    this.gameDataService.guardarDecision(decision).subscribe({
      next: (response) => {
        this.enviandoDecisiones = false;

        // Marcar personaje como servido
        this.gameDataService.marcarPersonajeServido(this.personajeActual!.id);

        // Mostrar mensaje de éxito
        this.mostrarExito(`¡Plato servido para ${this.personajeActual!.nombre}!`);

        // Limpiar plato
        this.limpiarPlato();

        // Pasar al siguiente personaje automáticamente
        setTimeout(() => {
          this.siguienteAccion();
        }, 1500);
      },
      error: (error) => {
        console.error('Error al guardar decisión:', error);
        this.enviandoDecisiones = false;
        this.mostrarError('Error al guardar el plato. Por favor, intenta nuevamente.');
      }
    });
  }

  private siguienteAccion(): void {
    // Verificar si quedan personajes pendientes
    const siguientePersonaje = this.gameDataService.obtenerSiguientePersonaje();

    if (siguientePersonaje) {
      // Seleccionar siguiente personaje automáticamente
      this.seleccionarPersonaje(siguientePersonaje);
    } else {
      // Todos los personajes servidos - finalizar juego
      this.finalizarJuego();
    }
  }

  private finalizarJuego(): void {
    // Finalizar sesión
    const sesionId = this.authService.getSesionId();
    if (sesionId) {
      this.apiService.finalizarSesion(sesionId, { estado: 'completada' }).subscribe({
        next: () => {
          this.authService.updateSesionStatus('completada');
          this.juegoCompletado = true;
          this.mostrarExito('¡Juego completado! Gracias por participar.');

          // Navegar a pantalla de agradecimiento después de 3 segundos
          setTimeout(() => {
            this.authService.clearSession();
            this.router.navigate(['/']);
          }, 3000);
        },
        error: (error) => {
          console.error('Error al finalizar sesión:', error);
        }
      });
    }
  }

  limpiarPlato(): void {
    this.ingredientesEnPlato = [];
  }

  getNombreEscenario(): string {
    const nombres = {
      'desayuno': 'Desayuno',
      'almuerzo': 'Almuerzo',
      'cena': 'Cena'
    };
    return nombres[this.escenarioActual];
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    setTimeout(() => {
      this.mensajeExito = '';
    }, 3000);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    setTimeout(() => {
      this.mensajeError = '';
    }, 5000);
  }

  // Métodos para filtrar ingredientes por categoría
  getIngredientesPorCategoria(categoria: string): Ingrediente[] {
    return this.ingredientes.filter(i => i.categoria === categoria);
  }

  getCantidadTotal(): number {
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

  onServirPlato(): void {
    if (!this.platoDropZoneComponent) return;
    this.platoDropZoneComponent.servirPlato();
  }

  // Métodos para el progreso
  getPersonajesServidos(): number {
    return this.personajes.filter(p => p.estado === 'servido').length;
  }

  getTotalPersonajes(): number {
    return this.personajes.length;
  }

  getProgresoPercentage(): number {
    const total = this.getTotalPersonajes();
    if (total === 0) return 0;
    return (this.getPersonajesServidos() / total) * 100;
  }
}
