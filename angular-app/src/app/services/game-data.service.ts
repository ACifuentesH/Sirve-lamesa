import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  estado?: 'pendiente' | 'en_curso' | 'servido';
}

export interface ComponenteServido {
  componente_id: number;
  nombre: string;
  cantidad_gramos: number;
  imagen?: string;
}

export interface Decision {
  sesion_id?: number;
  escenario: 'desayuno' | 'almuerzo' | 'cena';
  personaje_tipo: string;
  personaje_edad_rango: string;
  personaje_sexo: string;
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
  // Personajes sintéticos hardcoded
  private personajes: PersonajeSintetico[] = [
    { id: 1, tipo: 'niño', edad_rango: '6-11', sexo: 'M', imagen: 'niño.png', nombre: 'Niño (6-11 años)' },
    { id: 2, tipo: 'niña', edad_rango: '6-11', sexo: 'F', imagen: 'niño.png', nombre: 'Niña (6-11 años)' },
    { id: 3, tipo: 'adolescente_hombre', edad_rango: '12-17', sexo: 'M', imagen: 'niño.png', nombre: 'Adolescente Hombre (12-17 años)' },
    { id: 4, tipo: 'adolescente_mujer', edad_rango: '12-17', sexo: 'F', imagen: 'niño.png', nombre: 'Adolescente Mujer (12-17 años)' },
    { id: 5, tipo: 'adulto_joven_hombre', edad_rango: '18-25', sexo: 'M', imagen: 'niño-comiendo.png', nombre: 'Adulto Joven Hombre (18-25 años)' },
    { id: 6, tipo: 'adulto_joven_mujer', edad_rango: '18-25', sexo: 'F', imagen: 'niño-comiendo.png', nombre: 'Adulto Joven Mujer (18-25 años)' },
    { id: 7, tipo: 'adulto_hombre', edad_rango: '30-50', sexo: 'M', imagen: 'niño-cubierto-plato.png', nombre: 'Adulto Hombre (30-50 años)' },
    { id: 8, tipo: 'adulto_mujer', edad_rango: '30-50', sexo: 'F', imagen: 'niño-cubierto-plato.png', nombre: 'Adulto Mujer (30-50 años)' }
  ];

  // BehaviorSubjects para estado del juego
  private escenarioActualSubject = new BehaviorSubject<'desayuno' | 'almuerzo' | 'cena'>('desayuno');
  private personajeActualSubject = new BehaviorSubject<PersonajeSintetico | null>(null);
  private personajesSubject = new BehaviorSubject<PersonajeSintetico[]>(this.resetearPersonajes());
  private decisionesTemporalesSubject = new BehaviorSubject<Decision[]>([]);
  private ingredientesSubject = new BehaviorSubject<Ingrediente[]>([]);
  private tiempoInicioDecisionSubject = new BehaviorSubject<number>(0);
  private ordenServicioSubject = new BehaviorSubject<number>(1);

  // Observables públicos
  public escenarioActual$ = this.escenarioActualSubject.asObservable();
  public personajeActual$ = this.personajeActualSubject.asObservable();
  public personajes$ = this.personajesSubject.asObservable();
  public decisionesTemporales$ = this.decisionesTemporalesSubject.asObservable();
  public ingredientes$ = this.ingredientesSubject.asObservable();

  constructor() {
    // Cargar ingredientes (hardcoded por ahora)
    this.cargarIngredientes();
  }

  private cargarIngredientes(): void {
    const ingredientes: Ingrediente[] = [
      { id: 1, nombre: 'Carne', imagen: 'carne.png', categoria: 'proteina', unidad: 'gramos', porcionDefault: 100 },
      { id: 2, nombre: 'Pollo Frito', imagen: 'pollo_frito.png', categoria: 'proteina', unidad: 'gramos', porcionDefault: 150 },
      { id: 3, nombre: 'Muslo de Pollo', imagen: 'muslo_de_pollo.png', categoria: 'proteina', unidad: 'gramos', porcionDefault: 120 },
      { id: 4, nombre: 'Pescado', imagen: 'pescado.png', categoria: 'proteina', unidad: 'gramos', porcionDefault: 150 },
      { id: 5, nombre: 'Tocineta', imagen: 'tocineta.png', categoria: 'proteina', unidad: 'gramos', porcionDefault: 30 },
      { id: 6, nombre: 'Salchicha', imagen: 'salchicha.png', categoria: 'proteina', unidad: 'gramos', porcionDefault: 50 },
      { id: 7, nombre: 'Huevo Frito', imagen: 'huevo_frito.png', categoria: 'proteina', unidad: 'unidad', porcionDefault: 1 },
      { id: 8, nombre: 'Papa', imagen: 'papa.png', categoria: 'carbohidrato', unidad: 'gramos', porcionDefault: 150 },
      { id: 9, nombre: 'Pan Tostado', imagen: 'pan tostado.png', categoria: 'carbohidrato', unidad: 'rebanadas', porcionDefault: 2 },
      { id: 10, nombre: 'Bagel', imagen: 'bagle.png', categoria: 'carbohidrato', unidad: 'unidad', porcionDefault: 1 },
      { id: 11, nombre: 'Croissant', imagen: 'croisant1.png', categoria: 'carbohidrato', unidad: 'unidad', porcionDefault: 1 },
      { id: 12, nombre: 'Crackers', imagen: 'crackers.png', categoria: 'carbohidrato', unidad: 'gramos', porcionDefault: 30 },
      { id: 13, nombre: 'Muffin', imagen: 'muffin.png', categoria: 'carbohidrato', unidad: 'unidad', porcionDefault: 1 },
      { id: 14, nombre: 'Zanahoria', imagen: 'zanahoria.png', categoria: 'vegetal', unidad: 'gramos', porcionDefault: 80 },
      { id: 15, nombre: 'Tomate', imagen: 'tomate.png', categoria: 'vegetal', unidad: 'gramos', porcionDefault: 100 },
      { id: 16, nombre: 'Tomate Cherry', imagen: 'tomate_cherry.png', categoria: 'vegetal', unidad: 'unidades', porcionDefault: 5 },
      { id: 17, nombre: 'Pepino', imagen: 'pepino.png', categoria: 'vegetal', unidad: 'gramos', porcionDefault: 50 },
      { id: 18, nombre: 'Aguacate', imagen: 'aguacate.png', categoria: 'vegetal', unidad: 'gramos', porcionDefault: 100 },
      { id: 19, nombre: 'Espárragos', imagen: 'esparragos.png', categoria: 'vegetal', unidad: 'gramos', porcionDefault: 80 },
      { id: 20, nombre: 'Manzana', imagen: 'manzana.png', categoria: 'fruta', unidad: 'unidad', porcionDefault: 1 },
      { id: 21, nombre: 'Naranja', imagen: 'naranja.png', categoria: 'fruta', unidad: 'unidad', porcionDefault: 1 },
      { id: 22, nombre: 'Cambur', imagen: 'cambur.png', categoria: 'fruta', unidad: 'unidad', porcionDefault: 1 },
      { id: 23, nombre: 'Fresa', imagen: 'fresa.png', categoria: 'fruta', unidad: 'gramos', porcionDefault: 100 },
      { id: 24, nombre: 'Frambuesas', imagen: 'frambuesas.png', categoria: 'fruta', unidad: 'gramos', porcionDefault: 50 },
      { id: 25, nombre: 'Durazno', imagen: 'durazno.png', categoria: 'fruta', unidad: 'unidad', porcionDefault: 1 },
      { id: 26, nombre: 'Patilla', imagen: 'patilla.png', categoria: 'fruta', unidad: 'gramos', porcionDefault: 200 },
      { id: 27, nombre: 'Nueces', imagen: 'nueces.png', categoria: 'fruta', unidad: 'gramos', porcionDefault: 30 }
    ];

    this.ingredientesSubject.next(ingredientes);
  }

  private resetearPersonajes(): PersonajeSintetico[] {
    return this.personajes.map(p => ({ ...p, estado: 'pendiente' }));
  }

  // ===================================
  // GESTIÓN DE ESCENARIOS
  // ===================================

  setEscenario(escenario: 'desayuno' | 'almuerzo' | 'cena'): void {
    this.escenarioActualSubject.next(escenario);
    this.personajesSubject.next(this.resetearPersonajes());
    this.ordenServicioSubject.next(1);
  }

  getEscenarioActual(): 'desayuno' | 'almuerzo' | 'cena' {
    return this.escenarioActualSubject.value;
  }

  siguienteEscenario(): void {
    const actual = this.getEscenarioActual();
    const escenarios: Array<'desayuno' | 'almuerzo' | 'cena'> = ['desayuno', 'almuerzo', 'cena'];
    const indice = escenarios.indexOf(actual);
    if (indice < escenarios.length - 1) {
      this.setEscenario(escenarios[indice + 1]);
    }
  }

  // ===================================
  // GESTIÓN DE PERSONAJES
  // ===================================

  getPersonajes(): PersonajeSintetico[] {
    return this.personajesSubject.value;
  }

  setPersonajeActual(personaje: PersonajeSintetico): void {
    // Marcar personaje como en curso
    const personajes = this.personajesSubject.value.map(p =>
      p.id === personaje.id ? { ...p, estado: 'en_curso' as const } : p
    );
    this.personajesSubject.next(personajes);
    this.personajeActualSubject.next(personaje);
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

  agregarDecisionTemporal(decision: Decision): void {
    const decisiones = [...this.decisionesTemporalesSubject.value, decision];
    this.decisionesTemporalesSubject.next(decisiones);
    this.ordenServicioSubject.next(this.ordenServicioSubject.value + 1);
  }

  obtenerDecisionesTemporales(): Decision[] {
    return this.decisionesTemporalesSubject.value;
  }

  limpiarDecisionesTemporales(): void {
    this.decisionesTemporalesSubject.next([]);
  }

  getOrdenServicioActual(): number {
    return this.ordenServicioSubject.value;
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
    this.setEscenario('desayuno');
    this.personajeActualSubject.next(null);
    this.limpiarDecisionesTemporales();
    this.ordenServicioSubject.next(1);
  }

  esUltimoEscenario(): boolean {
    return this.getEscenarioActual() === 'cena';
  }

  todosLosPersonajesServidos(): boolean {
    return this.personajesSubject.value.every(p => p.estado === 'servido');
  }
}
