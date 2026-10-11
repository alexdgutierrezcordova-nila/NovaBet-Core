import { 
  Component, 
  OnInit, 
  OnDestroy,
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BilleteraService } from '../../../domains/billetera/billetera.service';

/**
 * @class Header
 * @description Componente de barra superior de NovaBet (Módulo 3).
 * 
 * ARQUITECTURA:
 * - Standalone Component con estrategia de detección OnPush.
 * - Reactividad con Angular Signals: `saldoCentavos` y `saldoFormateado` (computado reactivamente).
 * - Desacoplamiento Modular (Días 1 al 3):
 *   Funciona de manera autónoma consumiendo `BilleteraService`.
 *   Escucha notificaciones de confirmación de apuestas para refrescar el saldo
 *   sin acoplarse directamente al código no integrado de otros integrantes.
 * - Zero-Floats: Almacena centavos internamente y proyecta en USD ($) para la vista.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header implements OnInit, OnDestroy {
  private readonly billeteraService = inject(BilleteraService);

  // Signals de estado
  readonly saldoCentavos = signal<number>(100000);
  readonly cargando = signal<boolean>(false);
  readonly recargando = signal<boolean>(false);
  readonly mensajeFeedback = signal<string | null>(null);

  /**
   * Proyección matemática en dólares para la interfaz de usuario.
   * Divide los centavos enteros entre 100 con formato de moneda USD.
   */
  readonly saldoFormateado = computed(() => {
    return (this.saldoCentavos() / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  });

  private listenerApuesta?: () => void;

  ngOnInit(): void {
    this.cargarBalance();

    // Sincronización desacoplada con confirmaciones de apuestas (SSR-safe)
    if (typeof window !== 'undefined') {
      const handler = () => this.cargarBalance();
      window.addEventListener('novabet:apuestaConfirmada', handler);
      this.listenerApuesta = () => window.removeEventListener('novabet:apuestaConfirmada', handler);
    }
  }

  ngOnDestroy(): void {
    this.listenerApuesta?.();
  }

  /**
   * Consulta el saldo actual en el backend.
   */
  cargarBalance(): void {
    this.cargando.set(true);
    this.billeteraService.obtenerBalance('usr-demo').subscribe({
      next: (billetera) => {
        this.saldoCentavos.set(billetera.saldoCentavos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  /**
   * Ejecuta la recarga rápida de fondos (+ $500.00 USD / 50,000 centavos) según RF05.
   */
  recargar(): void {
    if (this.recargando()) return;

    this.recargando.set(true);
    this.mensajeFeedback.set(null);

    // 50,000 centavos = $500.00 USD
    this.billeteraService.recargarSaldo(50000, 'usr-demo').subscribe({
      next: (billetera) => {
        this.saldoCentavos.set(billetera.saldoCentavos);
        this.recargando.set(false);
        this.mostrarFeedback('+ $500.00 acreditados');
      },
      error: () => {
        this.recargando.set(false);
        this.mostrarFeedback('Error al recargar');
      }
    });
  }

  private mostrarFeedback(msg: string): void {
    this.mensajeFeedback.set(msg);
    setTimeout(() => {
      this.mensajeFeedback.set(null);
    }, 3000);
  }
}
