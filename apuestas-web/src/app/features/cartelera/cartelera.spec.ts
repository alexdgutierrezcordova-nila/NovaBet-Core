import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Cartelera } from './cartelera';
import { EventosService } from '../../domains/eventos/eventos.service';

describe('Cartelera', () => {
  let component: Cartelera;
  let fixture: ComponentFixture<Cartelera>;

  const mockEventosService = {
    obtenerEventos: () => of([]),
    obtenerEventoPorId: () => of(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cartelera],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EventosService, useValue: mockEventosService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Cartelera);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
