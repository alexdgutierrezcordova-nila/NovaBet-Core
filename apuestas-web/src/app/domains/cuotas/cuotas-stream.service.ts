import {
  Injectable,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { MercadoActualizadoStream } from '../cuotas/mercado.model';
import { BetslipService } from '../apuestas/betslip.service';
import { API_BASE_URL } from '../api.config';

/**
 * CuotasStreamService — Módulo 2 (Carlos)
 *
 * Abre la conexión EventSource al stream SSE de cuotas del Integrante 1
 * (GET /api/cuotas/stream) de forma SSR-safe usando isPlatformBrowser.
 *
 * Responsabilidades:
 *  - Mantener la conexión viva y reconectarla si cae
 *  - Enviar cada evento recibido a BetslipService.sincronizarStreamMercado()
 *    para que las cuotas del cupón se actualicen en tiempo real
 *  - Emitir stream$ para que la Cartelera (Módulo 1) también pueda
 *    suscribirse a los eventos SSE sin abrir una segunda conexión
 */
@Injectable({ providedIn: 'root' })
export class CuotasStreamService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly betslipService = inject(BetslipService);

  private eventSource: EventSource | null = null;
  private reconectarTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Observable al que la Cartelera (Módulo 1) puede suscribirse */
  readonly stream$ = new Subject<MercadoActualizadoStream>();

  private readonly sseUrl = `${API_BASE_URL}/cuotas/stream`;
  private readonly RECONECTAR_MS = 3000;

  /**
   * Inicia la conexión SSE. Debe llamarse una sola vez desde el componente
   * raíz (AppComponent) o desde el componente Betslip en ngOnInit.
   * Es seguro llamarlo múltiples veces: si ya hay una conexión abierta no crea otra.
   */
  conectar(): void {
    // Guard SSR / Unit Tests: EventSource sólo existe en entornos con soporte nativo
    if (!isPlatformBrowser(this.platformId) || typeof EventSource === 'undefined') return;

    // No abrir una segunda conexión si ya está activa
    if (
      this.eventSource &&
      this.eventSource.readyState !== EventSource.CLOSED
    ) {
      return;
    }

    this.eventSource = new EventSource(this.sseUrl);

    this.eventSource.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as MercadoActualizadoStream;

        // 1. Sincronizar el estado del Betslip (cuota en vivo, suspensión)
        this.betslipService.sincronizarStreamMercado(payload);

        // 2. Emitir para suscriptores externos (Cartelera, Módulo 1)
        this.stream$.next(payload);
      } catch {
        // Ignorar mensajes mal formados sin romper la conexión
      }
    };

    this.eventSource.onerror = () => {
      // La conexión se cayó → cerrar y reconectar tras RECONECTAR_MS
      this.eventSource?.close();
      this.eventSource = null;

      this.reconectarTimeout = setTimeout(() => {
        this.conectar();
      }, this.RECONECTAR_MS);
    };
  }

  /** Cierra la conexión SSE y cancela reconexiones pendientes */
  desconectar(): void {
    if (this.reconectarTimeout !== null) {
      clearTimeout(this.reconectarTimeout);
      this.reconectarTimeout = null;
    }
    this.eventSource?.close();
    this.eventSource = null;
  }

  ngOnDestroy(): void {
    this.desconectar();
    this.stream$.complete();
  }
}
