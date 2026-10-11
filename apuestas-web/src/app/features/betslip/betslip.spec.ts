import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Betslip } from './betslip';

describe('Betslip', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Betslip],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('debe crear el componente Betslip y calcular centavos enteros', () => {
    const fixture = TestBed.createComponent(Betslip);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    component.cargarSeleccionDemo('LOCAL');
    component.fijarMontoRapido(25);
    expect(component.montoCentavos()).toBe(2500);
    expect(component.gananciaPotencialUSD()).toBe(52.5);
  });
});
