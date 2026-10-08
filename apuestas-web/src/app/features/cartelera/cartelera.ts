import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventosService } from '../../domains/eventos/eventos.service';
import { BetslipService } from '../../domains/apuestas/betslip.service';
import { Evento, OpcionSeleccionada } from '../../domains/eventos/evento.model';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cartelera.html',
  styleUrls: ['./cartelera.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Cartelera {
  private readonly eventosService = inject(EventosService);
  private readonly betslipService = inject(BetslipService);

  readonly eventos = this.eventosService.eventos;
  readonly seleccionActiva = this.betslipService.seleccion;

  seleccionar(evento: Evento, opcion: OpcionSeleccionada) {
    this.betslipService.seleccionarCuota(evento, opcion);
  }

  esSeleccionada(eventoId: string, opcion: OpcionSeleccionada): boolean {
    const sel = this.seleccionActiva();
    return sel?.evento.id === eventoId && sel.opcion === opcion;
  }
}
