import { Injectable, signal } from '@angular/core';
import { Evento, ResultadoGanador } from './evento.model';
import { EVENTOS_MOCK } from './eventos.mock';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  // Manejo de estado con Signals para reactividad inmediata
  private readonly _eventos = signal<Evento[]>(EVENTOS_MOCK);
  readonly eventos = this._eventos.asReadonly();

  obtenerEventos() {
    return this.eventos();
  }

  obtenerEventoPorId(id: string): Evento | undefined {
    return this.eventos().find(e => e.id === id);
  }

  // Permite simular en el frontend la resolución de un partido
  simularResultado(eventoId: string, resultado: ResultadoGanador, marcador: string) {
    this._eventos.update(actuales => 
      actuales.map(evento => {
        if (evento.id === eventoId) {
          return {
            ...evento,
            estado: 'FINALIZADO',
            resultado,
            marcadorFinal: marcador
          };
        }
        return evento;
      })
    );
  }
}
