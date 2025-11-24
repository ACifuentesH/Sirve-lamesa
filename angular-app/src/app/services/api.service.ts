import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  // ===================================
  // PARTICIPANTES
  // ===================================
  
  crearParticipante(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/participantes`, data, this.httpOptions);
  }

  obtenerParticipante(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/participantes/${id}`);
  }

  actualizarParticipante(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/participantes/${id}`, data, this.httpOptions);
  }

  // ===================================
  // SESIONES
  // ===================================

  iniciarSesion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sesiones`, data, this.httpOptions);
  }

  finalizarSesion(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sesiones/${id}`, data, this.httpOptions);
  }

  obtenerSesion(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sesiones/${id}`);
  }

  obtenerDecisionesDeSesion(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sesiones/${id}/decisiones`);
  }

  // ===================================
  // PERSONAJES
  // ===================================

  obtenerPersonajes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/personajes`);
  }

  obtenerPersonaje(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/personajes/${id}`);
  }

  // ===================================
  // INGREDIENTES
  // ===================================

  obtenerIngredientes(categoria?: string): Observable<any> {
    const url = categoria 
      ? `${this.apiUrl}/ingredientes?categoria=${categoria}`
      : `${this.apiUrl}/ingredientes`;
    return this.http.get(url);
  }

  obtenerIngrediente(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ingredientes/${id}`);
  }

  // ===================================
  // MENÚ
  // ===================================

  obtenerMenus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/menu`);
  }

  obtenerPlatosDeMenu(menuId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/menu/platos/${menuId}`);
  }

  obtenerComponentesDePlato(platoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/menu/componentes/${platoId}`);
  }

  obtenerBebidas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/menu/bebidas`);
  }

  obtenerBebidasDeMenu(menuId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/menu/bebidas/${menuId}`);
  }

  // ===================================
  // DECISIONES
  // ===================================

  registrarDecision(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/decisiones`, data, this.httpOptions);
  }

  registrarDecisionesBatch(decisiones: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/decisiones/batch`, { decisiones }, this.httpOptions);
  }

  // ===================================
  // ESTADÍSTICAS
  // ===================================

  obtenerEstadisticasGenerales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/generales`);
  }

  obtenerEstadisticasPorGenero(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/por-genero`);
  }

  obtenerEstadisticasPorEdad(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas/por-edad`);
  }

  // ===================================
  // SISTEMA
  // ===================================

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-connection`);
  }
}
