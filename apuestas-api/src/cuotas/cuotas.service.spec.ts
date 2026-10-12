import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuotasService } from './cuotas.service';
import { Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';

describe('CuotasService', () => {
  let service: CuotasService;
  let mockMercadoModel: any;
  let mockEventoModel: any;

  const mockEventoId = new Types.ObjectId();
  const mockEvento = {
    _id: mockEventoId,
    equipoLocal: 'Real Madrid',
    equipoVisitante: 'Manchester City',
    estado: 'LIVE',
    marcador: { local: 1, visitante: 0 },
  };

  const mockMercado = {
    _id: new Types.ObjectId(),
    eventoId: mockEventoId,
    tipo: '1X2',
    estadoMercado: 'ABIERTO',
    cuotas: { local: 2.10, empate: 3.40, visitante: 3.20 },
    cuotasVersion: 1,
    save: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    mockEventoModel = {
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([mockEvento]),
        }),
      }),
      findByIdAndUpdate: vi.fn().mockResolvedValue(true),
    };

    mockMercadoModel = {
      findOne: vi.fn().mockResolvedValue(mockMercado),
    };

    service = new CuotasService(mockMercadoModel, mockEventoModel);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe ejecutar un ciclo de simulación, incrementar cuotasVersion y emitir evento SSE', async () => {
    const promesaStream = firstValueFrom(service.obtenerStream());

    const resultado = await service.ejecutarCicloSimulacion();

    expect(resultado).toBeDefined();
    expect(resultado?.eventoId).toBe(mockEventoId.toString());
    expect(resultado?.cuotasVersion).toBe(2);
    expect(mockMercado.save).toHaveBeenCalled();

    const eventoEmitido = await promesaStream;
    expect(eventoEmitido.data).toEqual(resultado);
  });

  it('debe mantener las cuotas redondeadas a 2 decimales y por encima de 1.05', async () => {
    const resultado = await service.ejecutarCicloSimulacion();

    expect(resultado?.cuotas.local).toBeGreaterThanOrEqual(1.05);
    expect(resultado?.cuotas.empate).toBeGreaterThanOrEqual(1.05);
    expect(resultado?.cuotas.visitante).toBeGreaterThanOrEqual(1.05);

    // Verificar que tienen a lo sumo 2 decimales
    const decimalesLocal = resultado!.cuotas.local.toString().split('.')[1]?.length ?? 0;
    expect(decimalesLocal).toBeLessThanOrEqual(2);
  });
});
