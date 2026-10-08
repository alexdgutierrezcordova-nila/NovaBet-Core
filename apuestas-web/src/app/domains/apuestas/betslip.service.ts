import { Injectable, signal, computed } from '@angular/core';
import { Evento, OpcionSeleccionada } from '../eventos/evento.model';
import { TicketApuesta } from './apuesta.model';

export interface SeleccionActiva {
  evento: Evento;
  opcion: OpcionSeleccionada;
  cuota: number;
}

@Injectable({
  providedIn: 'root'
})
export class BetslipService {
  // Estado reactivo del cupón
  readonly seleccion = signal<SeleccionActiva | null>(null);
  readonly montoApostado = signal<number>(10);
  readonly saldoUsuario = signal<number>(1000.00);
  readonly historialTickets = signal<TicketApuesta[]>([]);

  // Ganancia potencial computada automáticamente
  readonly gananciaPotencial = computed(() => {
    const sel = this.seleccion();
    const monto = this.montoApostado();
    if (!sel || monto <= 0) return 0;
    return Number((monto * sel.cuota).toFixed(2));
  });

  seleccionarCuota(evento: Evento, opcion: OpcionSeleccionada) {
    const cuota = opcion === 'LOCAL' 
      ? evento.cuotas.local 
      : opcion === 'EMPATE' 
        ? evento.cuotas.empate 
        : evento.cuotas.visitante;

    this.seleccion.set({ evento, opcion, cuota });
  }

  limpiarSeleccion() {
    this.seleccion.set(null);
  }

  setMonto(nuevoMonto: number) {
    this.montoApostado.set(nuevoMonto);
  }

  recargarSaldo(monto: number) {
    if (monto > 0) {
      this.saldoUsuario.update(s => Number((s + monto).toFixed(2)));
    }
  }

  colocarApuesta(): { exito: boolean; mensaje: string; ticket?: TicketApuesta } {
    const sel = this.seleccion();
    const monto = this.montoApostado();

    if (!sel) {
      return { exito: false, mensaje: 'No hay ninguna selección en el cupón' };
    }

    if (monto <= 0) {
      return { exito: false, mensaje: 'El monto a apostar debe ser mayor a 0' };
    }

    if (this.saldoUsuario() < monto) {
      return { exito: false, mensaje: 'Saldo insuficiente para realizar la apuesta' };
    }

    // Debitar saldo
    this.saldoUsuario.update(s => Number((s - monto).toFixed(2)));

    // Crear ticket
    const ticket: TicketApuesta = {
      id: 'tkt-' + Date.now(),
      usuarioId: 'usr-demo',
      eventoId: sel.evento.id,
      eventoResumen: {
        partido: `${sel.evento.equipoLocal} vs ${sel.evento.equipoVisitante}`,
        liga: sel.evento.liga
      },
      seleccion: sel.opcion,
      cuotaJugada: sel.cuota,
      montoApostado: monto,
      gananciaPotencial: this.gananciaPotencial(),
      estado: 'PENDIENTE',
      creadoEn: new Date().toISOString()
    };

    this.historialTickets.update(tickets => [ticket, ...tickets]);
    this.limpiarSeleccion();

    return { exito: true, mensaje: '¡Apuesta colocada con éxito!', ticket };
  }
}
