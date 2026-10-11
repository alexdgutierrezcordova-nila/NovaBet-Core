import { HttpStatus } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApuestasController } from './apuestas.controller';
import { ApuestasService } from './apuestas.service';
import { CreateApuestaDto } from './dto/create-apuesta.dto';

describe('ApuestasController (Módulo 2)', () => {
  let controller: ApuestasController;
  let mockService: any;

  const dto: CreateApuestaDto = {
    eventoId: '670800000000000000000001',
    seleccion: 'LOCAL',
    montoCentavos: 1000,
    cuotasVersion: 1,
    idempotencyKey: 'uuid-controller-test',
  };

  beforeEach(() => {
    mockService = {
      crearApuesta: vi.fn(),
      obtenerHistorial: vi.fn(),
    };
    controller = new ApuestasController(mockService as ApuestasService);
  });

  it('debe responder HTTP 201 Created cuando el ticket es nuevo', async () => {
    const ticket = { _id: 'nuevo-1', montoCentavos: 1000 };
    mockService.crearApuesta.mockResolvedValue({ ticket, esNuevo: true });
    const res = { status: vi.fn() } as any;

    const resultado = await controller.crearApuesta(dto, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(resultado).toBe(ticket);
  });

  it('debe responder HTTP 200 OK cuando la idempotencyKey ya fue procesada (RNF04)', async () => {
    const ticket = { _id: 'existente-1', montoCentavos: 1000 };
    mockService.crearApuesta.mockResolvedValue({ ticket, esNuevo: false });
    const res = { status: vi.fn() } as any;

    const resultado = await controller.crearApuesta(dto, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(resultado).toBe(ticket);
  });
});
