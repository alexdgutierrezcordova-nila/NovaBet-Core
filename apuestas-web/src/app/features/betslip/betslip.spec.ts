import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Betslip } from './betslip';
import { CuotasStreamService } from '../../domains/cuotas/cuotas-stream.service';

describe('Betslip (Módulo 2)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Betslip],
      providers: [
        provideHttpClient(),
        {
          provide: CuotasStreamService,
          useValue: {
            conectar: () => undefined,
            desconectar: () => undefined,
          },
        },
      ],
    }).compileComponents();
  });

  it('debe crear el componente Betslip y calcular centavos enteros y ganancia potencial', () => {
    const fixture = TestBed.createComponent(Betslip);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();

    component.cargarSeleccionDemo('LOCAL');
    component.fijarMontoRapido(25);

    expect(component.montoCentavos()).toBe(2500);
    expect(component.gananciaPotencialUSD()).toBe(52.5);
  });

  it('debe sincronizar cuotas en tiempo real y bloquear el botón cuando el mercado pasa a SUSPENDIDO', () => {
    const fixture = TestBed.createComponent(Betslip);
    const component = fixture.componentInstance;

    component.cargarSeleccionDemo('LOCAL');
    expect(component.mercadoSuspendido()).toBe(false);

    component.betslipService.sincronizarStreamMercado({
      eventoId: '670800000000000000000001',
      estadoMercado: 'SUSPENDIDO',
      cuotas: { local: 2.35, empate: 3.2, visitante: 3.1 },
      cuotasVersion: 2,
      minutoSimulado: 40,
      marcador: { local: 2, visitante: 1 },
      emitidoEn: new Date().toISOString(),
    });

    expect(component.seleccion()?.cuota).toBe(2.35);
    expect(component.tendenciaCuota()).toBe('sube');
    expect(component.mercadoSuspendido()).toBe(true);
    expect(component.botonDeshabilitado()).toBe(true);
  });
});
