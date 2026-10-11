import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { BetslipService } from '../../domains/apuestas/betslip.service';
import { CuotasStreamService } from '../../domains/cuotas/cuotas-stream.service';
import { TicketApuesta } from '../../domains/apuestas/apuesta.model';
import { Evento } from '../../domains/eventos/evento.model';
import {
  Mercado,
  OpcionSeleccionada,
} from '../../domains/cuotas/mercado.model';

@Component({
  selector: 'app-betslip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './betslip.html',
  styleUrls: ['./betslip.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Betslip implements OnInit, OnDestroy {
  readonly betslipService = inject(BetslipService);
  private readonly cuotasStream = inject(CuotasStreamService);

  readonly seleccion = this.betslipService.seleccion;
  readonly montoUSD = this.betslipService.montoUSD;
  readonly montoCentavos = this.betslipService.montoCentavos;
  readonly gananciaPotencialUSD = this.betslipService.gananciaPotencialUSD;
  readonly cuotaCambiadaAviso = this.betslipService.cuotaCambiadaAviso;
  readonly mercadoSuspendido = this.betslipService.mercadoSuspendido;
  readonly tendenciaCuota = this.betslipService.tendenciaCuota;

  readonly procesando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly bloqueoMensaje = signal<string | null>(null);
  readonly ticketReciente = signal<TicketApuesta | null>(null);

  readonly montosRapidos = [5, 10, 25, 50, 100];

  ngOnInit(): void {
    // Inicia la conexión EventSource al stream SSE de cuotas (Módulo 1 / ADR-003)
    // Es SSR-safe: CuotasStreamService verifica isPlatformBrowser internamente.
    this.cuotasStream.conectar();
  }

  ngOnDestroy(): void {
    // Cerramos la conexión SSE cuando el componente se destruye para evitar memory leaks
    this.cuotasStream.desconectar();
  }

  readonly botonDeshabilitado = computed(() => {
    const sel = this.seleccion();
    return (
      !sel ||
      this.procesando() ||
      this.mercadoSuspendido() ||
      this.montoCentavos() < 100
    );
  });

  readonly etiquetaSeleccion = computed(() => {
    const sel = this.seleccion();
    if (!sel) return '';
    if (sel.opcion === 'LOCAL') return `1 • ${sel.evento.equipoLocal}`;
    if (sel.opcion === 'EMPATE') return 'X • Empate';
    return `2 • ${sel.evento.equipoVisitante}`;
  });

  onMontoInput(valor: string | number) {
    const num = typeof valor === 'number' ? valor : parseFloat(valor);
    this.betslipService.actualizarMonto(Number.isFinite(num) ? num : 0);
    this.errorMensaje.set(null);
  }

  fijarMontoRapido(monto: number) {
    this.betslipService.actualizarMonto(monto);
    this.errorMensaje.set(null);
  }

  limpiar() {
    this.betslipService.limpiarSeleccion();
    this.errorMensaje.set(null);
    this.bloqueoMensaje.set(null);
  }

  aceptarNuevaCuotaYContinuar() {
    this.betslipService.aceptarCambioCuota();
    this.onConfirmar();
  }

  onConfirmar() {
    if (this.botonDeshabilitado()) return;

    this.procesando.set(true);
    this.errorMensaje.set(null);
    this.bloqueoMensaje.set(null);
    this.ticketReciente.set(null);

    this.betslipService
      .confirmarApuesta()
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: (ticket) => {
          this.ticketReciente.set(ticket);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 423) {
            this.bloqueoMensaje.set(
              err.error?.message ||
                'Mercado suspendido temporalmente por incidente en el partido',
            );
          } else if (err.status === 400) {
            this.errorMensaje.set(
              err.error?.message ||
                'Saldo insuficiente o datos de apuesta inválidos',
            );
          } else if (err.status !== 409) {
            this.errorMensaje.set(
              'No se pudo procesar la apuesta. Verifica la conexión con el servidor.',
            );
          }
        },
      });
  }

  // Utilidad para probar el Betslip de forma autónoma antes de conectar Cartelera (M1)
  cargarSeleccionDemo(opcion: OpcionSeleccionada = 'LOCAL') {
    const eventoDemo: Evento = {
      _id: '670800000000000000000001',
      deporte: 'Fútbol',
      liga: 'UEFA Champions League',
      equipoLocal: 'Real Madrid',
      equipoVisitante: 'Manchester City',
      fechaProgramada: new Date().toISOString(),
      estado: 'LIVE',
      marcador: { local: 1, visitante: 1 },
      resultado: 'SIN_RESULTADO',
    };

    const mercadoDemo: Mercado = {
      _id: '670800000000000000000002',
      eventoId: eventoDemo._id,
      tipo: '1X2',
      estadoMercado: 'ABIERTO',
      cuotas: { local: 2.1, empate: 3.4, visitante: 3.25 },
      cuotasVersion: 1,
      actualizadoEn: new Date().toISOString(),
    };

    this.ticketReciente.set(null);
    this.errorMensaje.set(null);
    this.bloqueoMensaje.set(null);
    this.betslipService.seleccionarCuota(eventoDemo, mercadoDemo, opcion);
  }
}
