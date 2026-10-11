import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento } from './evento.model';
import { Mercado } from '../cuotas/mercado.model';
import { API_BASE_URL } from '../api.config';

export type EventoConMercado = Evento & {
  mercado: Mercado | null;
};

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/eventos`;

  obtenerEventos(): Observable<EventoConMercado[]> {
    return this.http.get<EventoConMercado[]>(this.apiUrl);
  }

  obtenerEventoPorId(id: string): Observable<EventoConMercado> {
    return this.http.get<EventoConMercado>(`${this.apiUrl}/${id}`);
  }
}
