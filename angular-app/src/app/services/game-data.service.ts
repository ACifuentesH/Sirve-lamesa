import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Ingrediente {
  id: number;
  nombre: string;
  imagen: string;
  categoria: string;
  unidad: string;
  porcionDefault: number;
}

export interface PersonajeSintetico {
  id: number;
  tipo: string;
  edad_rango: string;
  sexo: string;
  imagen: string;
  nombre: string;
  /** normopeso | sobrepeso | no_aplica — figura del personaje sintético */
  imc_representado?: string;
  estado?: 'pendiente' | 'en_curso' | 'servido';
}

export interface ComponenteServido {
  componente_id: number;
  nombre: string;
  cantidad_gramos: number;
  unidad?: string;
  imagen?: string;
}

export interface Decision {
  sesion_id?: number;
  escenario: 'desayuno' | 'almuerzo' | 'cena';
  personaje_tipo: string;
  personaje_edad_rango: string;
  personaje_sexo: string;
  personaje_imc_representado?: string | null;
  personaje_id?: number;
  plato_id?: number;
  bebida_id?: number;
  componentes_servidos: ComponenteServido[];
  tiempo_decision_ms: number;
  orden_servicio: number;
  notas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameDataService {
  // BehaviorSubjects para estado del juego
  private escenarioActualSubject = new BehaviorSubject<'desayuno' | 'almuerzo' | 'cena'>('desayuno');
  private personajeActualSubject = new BehaviorSubject<PersonajeSintetico | null>(null);
  private personajesSubject = new BehaviorSubject<PersonajeSintetico[]>([]);
  private ingredientesSubject = new BehaviorSubject<Ingrediente[]>([]);
  private tiempoInicioDecisionSubject = new BehaviorSubject<number>(0);
  private ordenServicioSubject = new BehaviorSubject<number>(1);

  // Observables públicos
  public escenarioActual$ = this.escenarioActualSubject.asObservable();
  public personajeActual$ = this.personajeActualSubject.asObservable();
  public personajes$ = this.personajesSubject.asObservable();
  public ingredientes$ = this.ingredientesSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Los datos se cargarán desde la API cuando se inicialice el juego
  }

  // ===================================
  // CARGA DE DATOS DESDE API
  // ===================================

  cargarPersonajes(): Observable<any> {
    return new Observable(observer => {
      this.apiService.obtenerPersonajes().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Mapear datos de la BD al formato del frontend
            const personajes = response.data.map((p: any) => ({
              id: p.pk_personaje,
              tipo: p.tipo,
              edad_rango: p.edad_rango,
              sexo: p.sexo,
              imagen: p.imagen,
              nombre: p.nombre,
              imc_representado: p.imc_representado || 'no_aplica',
              estado: 'pendiente' as const
            }));
            this.personajesSubject.next(personajes);
            observer.next(personajes);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Error al cargar personajes:', error);
          observer.error(error);
        }
      });
    });
  }

  cargarIngredientes(): Observable<any> {
    return new Observable(observer => {
      this.apiService.obtenerIngredientes().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Mapear datos de la BD al formato del frontend
            const ingredientes = response.data
              .filter((i: any) => i.imagen) // Solo ingredientes con imagen
              .map((i: any) => ({
                id: i.pk_alimento,
                nombre: i.nombre,
                imagen: i.imagen,
                categoria: i.categoria,
                unidad: i.unidad,
                porcionDefault: i.porcion_default
              }));
            this.ingredientesSubject.next(ingredientes);
            observer.next(ingredientes);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Error al cargar ingredientes:', error);
          observer.error(error);
        }
      });
    });
  }

  inicializarDatos(): Observable<any> {
    return new Observable(observer => {
      // Cargar personajes e ingredientes en paralelo
      const personajes$ = this.cargarPersonajes();
      const ingredientes$ = this.cargarIngredientes();

      let personajesCargados = false;
      let ingredientesCargados = false;

      personajes$.subscribe({
        next: () => {
          personajesCargados = true;
          if (ingredientesCargados) {
            observer.next({ success: true });
            observer.complete();
          }
        },
        error: (error) => observer.error(error)
      });

      ingredientes$.subscribe({
        next: () => {
          ingredientesCargados = true;
          if (personajesCargados) {
            observer.next({ success: true });
            observer.complete();
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // ===================================
  // GESTIÓN DE ESCENARIOS (Ahora aleatorio)
  // ===================================

  asignarEscenarioAleatorio(): 'desayuno' | 'almuerzo' | 'cena' {
    const escenarios: Array<'desayuno' | 'almuerzo' | 'cena'> = ['desayuno', 'almuerzo', 'cena'];
    const indiceAleatorio = Math.floor(Math.random() * escenarios.length);
    const escenario = escenarios[indiceAleatorio];
    this.escenarioActualSubject.next(escenario);
    return escenario;
  }

  getEscenarioActual(): 'desayuno' | 'almuerzo' | 'cena' {
    return this.escenarioActualSubject.value;
  }

  setEscenario(escenario: 'desayuno' | 'almuerzo' | 'cena'): void {
    this.escenarioActualSubject.next(escenario);
  }

  // ===================================
  // GESTIÓN DE PERSONAJES
  // ===================================

  getPersonajes(): PersonajeSintetico[] {
    return this.personajesSubject.value;
  }

  setPersonajeActual(personaje: PersonajeSintetico): void {
    // Marcar personaje como en curso y asignar escenario aleatorio
    const personajes = this.personajesSubject.value.map(p =>
      p.id === personaje.id ? { ...p, estado: 'en_curso' as const } : p
    );
    this.personajesSubject.next(personajes);
    this.personajeActualSubject.next(personaje);
    
    // Asignar escenario aleatorio al seleccionar personaje
    this.asignarEscenarioAleatorio();
    
    this.iniciarTiempoDecision();
  }

  marcarPersonajeServido(personajeId: number): void {
    const personajes = this.personajesSubject.value.map(p =>
      p.id === personajeId ? { ...p, estado: 'servido' as const } : p
    );
    this.personajesSubject.next(personajes);
  }

  obtenerSiguientePersonaje(): PersonajeSintetico | null {
    const pendientes = this.personajesSubject.value.filter(p => p.estado === 'pendiente');
    return pendientes.length > 0 ? pendientes[0] : null;
  }

  todosLosPersonajesServidos(): boolean {
    return this.personajesSubject.value.every(p => p.estado === 'servido');
  }

  // ===================================
  // GESTIÓN DE DECISIONES
  // ===================================

  iniciarTiempoDecision(): void {
    this.tiempoInicioDecisionSubject.next(Date.now());
  }

  calcularTiempoDecision(): number {
    const inicio = this.tiempoInicioDecisionSubject.value;
    return Date.now() - inicio;
  }

  getOrdenServicioActual(): number {
    return this.ordenServicioSubject.value;
  }

  incrementarOrdenServicio(): void {
    this.ordenServicioSubject.next(this.ordenServicioSubject.value + 1);
  }

  guardarDecision(decision: Decision): Observable<any> {
    return new Observable(observer => {
      this.apiService.registrarDecision(decision).subscribe({
        next: (response) => {
          if (response.success) {
            this.incrementarOrdenServicio();
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error('Error al guardar decisión'));
          }
        },
        error: (error) => {
          console.error('Error al guardar decisión:', error);
          observer.error(error);
        }
      });
    });
  }

  // ===================================
  // GESTIÓN DE INGREDIENTES
  // ===================================

  getIngredientes(): Ingrediente[] {
    return this.ingredientesSubject.value;
  }

  getIngredientesByCategoria(categoria: string): Ingrediente[] {
    return this.ingredientesSubject.value.filter(i => i.categoria === categoria);
  }

  getIngredienteById(id: number): Ingrediente | undefined {
    return this.ingredientesSubject.value.find(i => i.id === id);
  }

  // ===================================
  // UTILIDADES
  // ===================================

  resetearJuego(): void {
    // Resetear estados de personajes
    const personajes = this.personajesSubject.value.map(p => ({
      ...p,
      estado: 'pendiente' as const
    }));
    this.personajesSubject.next(personajes);
    
    this.personajeActualSubject.next(null);
    this.ordenServicioSubject.next(1);
  }
}
