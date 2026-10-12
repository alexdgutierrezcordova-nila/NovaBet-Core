import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, Observable, catchError, throwError, tap } from 'rxjs';
import { Evento } from '../eventos/evento.model';
import {
  Cuotas1X2,
  Mercado,
  MercadoActualizadoStream,
  OpcionSeleccionada,
} from '../cuotas/mercado.model';
import { TicketApuesta } from './apuesta.model';
import { API_BASE_URL } from '../api.config';

export interface SeleccionActiva {
  evento: Evento;
  mercado: Mercado;
  opcion: OpcionSeleccionada;
  cuota: number;
  cuotaAnterior?: number;
}

@Injectable({ providedIn: 'root' })
export class BetslipService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/apuestas`;

  readonly seleccion = signal<SeleccionActiva | null>(null);
  readonly montoUSD = signal<number>(10); // En dólares para el input del usuario
  readonly cuotaCambiadaAviso = signal<string | null>(null);
  readonly tendenciaCuota = signal<'sube' | 'baja' | null>(null);

  readonly apuestaConfirmada$ = new Subject<void>();

  // Monto en centavos para enviar al backend
  readonly montoCentavos = computed(() => Math.round(this.montoUSD() * 100));

  readonly gananciaPotencialUSD = computed(() => {
    const sel = this.seleccion();
    const monto = this.montoUSD();
    if (!sel || monto <= 0) return 0;
    return Number((monto * sel.cuota).toFixed(2));
  });

  readonly mercadoSuspendido = computed(() => {
    const sel = this.seleccion();
    return sel ? sel.mercado.estadoMercado !== 'ABIERTO' : false;
  });

  seleccionarCuota(
    evento: Evento,
    mercado: Mercado,
    opcion: OpcionSeleccionada,
  ) {
    const cuota =
      opcion === 'LOCAL'
        ? mercado.cuotas.local
        : opcion === 'EMPATE'
          ? mercado.cuotas.empate
          : mercado.cuotas.visitante;

    this.cuotaCambiadaAviso.set(null);
    this.tendenciaCuota.set(null);
    this.seleccion.set({ evento, mercado, opcion, cuota });
  }

  actualizarMonto(monto: number) {
    this.montoUSD.set(Number.isFinite(monto) && monto >= 0 ? monto : 0);
  }

  limpiarSeleccion() {
    this.seleccion.set(null);
    this.cuotaCambiadaAviso.set(null);
    this.tendenciaCuota.set(null);
  }

  sincronizarStreamMercado(stream: MercadoActualizadoStream) {
    const actual = this.seleccion();
    if (!actual || actual.evento._id !== stream.eventoId) return;

    const nuevaCuota =
      actual.opcion === 'LOCAL'
        ? stream.cuotas.local
        : actual.opcion === 'EMPATE'
          ? stream.cuotas.empate
          : stream.cuotas.visitante;

    if (nuevaCuota > actual.cuota) {
      this.tendenciaCuota.set('sube');
    } else if (nuevaCuota < actual.cuota) {
      this.tendenciaCuota.set('baja');
    }

    this.seleccion.set({
      ...actual,
      cuotaAnterior: actual.cuota,
      cuota: nuevaCuota,
      evento: {
        ...actual.evento,
        marcador: stream.marcador,
      },
      mercado: {
        ...actual.mercado,
        estadoMercado: stream.estadoMercado,
        cuotas: stream.cuotas,
        cuotasVersion: stream.cuotasVersion,
        actualizadoEn: stream.emitidoEn,
      },
    });
  }

  confirmarApuesta(): Observable<TicketApuesta> {
    const sel = this.seleccion();
    if (!sel) return throwError(() => new Error('No hay selección'));

    const payload = {
      eventoId: sel.evento._id,
      seleccion: sel.opcion,
      montoCentavos: this.montoCentavos(),
      cuotasVersion: sel.mercado.cuotasVersion,
      idempotencyKey: crypto.randomUUID(),
    };

    return this.http.post<TicketApuesta>(this.apiUrl, payload).pipe(
      tap(() => {
        this.seleccion.set(null);
        this.cuotaCambiadaAviso.set(null);
        this.tendenciaCuota.set(null);
        this.apuestaConfirmada$.next(); // Notifica al Header del Módulo 3
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 409) {
          const cuotaNueva = err.error?.cuotaActualizada;
          const versionNueva = err.error?.cuotasVersionActual;
          if (cuotaNueva && versionNueva) {
            const anterior = sel.cuota;
            this.actualizarCuotaLocal(cuotaNueva, versionNueva);
            const actualizada = this.seleccion()?.cuota ?? anterior;
            this.cuotaCambiadaAviso.set(
              `La cuota ha cambiado de ${anterior.toFixed(2)} a ${actualizada.toFixed(2)}. ¿Deseas aceptar el cambio y continuar?`,
            );
          } else {
            this.cuotaCambiadaAviso.set(
              'La cuota ha cambiado. Por favor confirma el nuevo valor.',
            );
          }
        }
        return throwError(() => err);
      }),
    );
  }

  aceptarCambioCuota() {
    this.cuotaCambiadaAviso.set(null);
  }

  obtenerHistorial(): Observable<TicketApuesta[]> {
    return this.http.get<TicketApuesta[]>(`${this.apiUrl}/historial`);
  }

  private actualizarCuotaLocal(nuevasCuotas: Cuotas1X2, nuevaVersion: number) {
    const actual = this.seleccion();
    if (!actual) return;
    const nuevaCuota =
      actual.opcion === 'LOCAL'
        ? nuevasCuotas.local
        : actual.opcion === 'EMPATE'
          ? nuevasCuotas.empate
          : nuevasCuotas.visitante;

    this.tendenciaCuota.set(
      nuevaCuota > actual.cuota
        ? 'sube'
        : nuevaCuota < actual.cuota
          ? 'baja'
          : null,
    );

    this.seleccion.set({
      ...actual,
      cuotaAnterior: actual.cuota,
      cuota: nuevaCuota,
      mercado: {
        ...actual.mercado,
        cuotasVersion: nuevaVersion,
        cuotas: nuevasCuotas,
      },
    });
  }
}
