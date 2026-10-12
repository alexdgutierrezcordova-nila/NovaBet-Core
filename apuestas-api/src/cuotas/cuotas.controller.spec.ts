import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuotasController } from './cuotas.controller';
import { CuotasService } from './cuotas.service';
import { of, MessageEvent } from 'rxjs';

describe('CuotasController', () => {
  let controller: CuotasController;
  let mockCuotasService: Partial<CuotasService>;

  beforeEach(() => {
    mockCuotasService = {
      obtenerStream: vi.fn().mockReturnValue(
        of({
          data: {
            eventoId: 'test-123',
            estadoMercado: 'ABIERTO',
            cuotas: { local: 1.95, empate: 3.40, visitante: 4.10 },
            cuotasVersion: 1,
            minutoSimulado: 25,
            marcador: { local: 0, visitante: 0 },
            emitidoEn: new Date().toISOString(),
          },
        } as MessageEvent),
      ),
    };

    controller = new CuotasController(mockCuotasService as CuotasService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe retornar el Observable de stream proveniente de CuotasService', (done) => {
    const stream$ = controller.obtenerStream();
    expect(stream$).toBeDefined();

    stream$.subscribe((evento) => {
      expect(evento.data).toHaveProperty('eventoId', 'test-123');
      expect(evento.data).toHaveProperty('cuotasVersion', 1);
      expect(mockCuotasService.obtenerStream).toHaveBeenCalled();
    });
  });
});
