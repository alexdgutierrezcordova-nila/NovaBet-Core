import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { EventosService, EventoConMercado } from '../../domains/eventos/eventos.service';
import { Mercado, OpcionSeleccionada } from '../../domains/cuotas/mercado.model';
import { BetslipService } from '../../domains/apuestas/betslip.service';
import { CuotasStreamService } from '../../domains/cuotas/cuotas-stream.service';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './cartelera.html',
  styleUrl: './cartelera.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cartelera implements OnInit, OnDestroy {
  private readonly eventosService = inject(EventosService);
  private readonly betslipService = inject(BetslipService);
  private readonly cuotasStreamService = inject(CuotasStreamService);

  readonly eventos = signal<EventoConMercado[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  private streamSub?: Subscription;

  ngOnInit(): void {
    this.cargarEventos();
    this.iniciarStream();
  }

  cargarEventos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.eventosService.obtenerEventos().subscribe({
      next: (data) => {
        this.eventos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los partidos. Verifica que el backend esté encendido.');
        this.cargando.set(false);
      },
    });
  }

  seleccionarCuota(
    evento: EventoConMercado,
    mercado: Mercado,
    opcion: OpcionSeleccionada,
  ): void {
    if (mercado.estadoMercado !== 'ABIERTO') {
      return;
    }
    this.betslipService.seleccionarCuota(evento, mercado, opcion);
  }

  esSeleccionada(eventoId: string, opcion: OpcionSeleccionada): boolean {
    const seleccion = this.betslipService.seleccion();
    return (
      seleccion !== null &&
      seleccion.evento._id === eventoId &&
      seleccion.opcion === opcion
    );
  }

  private iniciarStream(): void {
    this.cuotasStreamService.conectar();

    this.streamSub = this.cuotasStreamService.stream$.subscribe((actualizacion) => {
      this.eventos.update((lista) =>
        lista.map((ev) => {
          if (ev._id === actualizacion.eventoId && ev.mercado) {
            return {
              ...ev,
              marcador: actualizacion.marcador ?? ev.marcador,
              mercado: {
                ...ev.mercado,
                cuotas: actualizacion.cuotas,
                cuotasVersion: actualizacion.cuotasVersion,
                estadoMercado: actualizacion.estadoMercado,
              },
            };
          }
          return ev;
        }),
      );
    });
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
  }
}
