import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApuestasService } from './apuestas.service';
import { CreateApuestaDto } from './dto/create-apuesta.dto';

describe('ApuestasService (Módulo 2)', () => {
  let service: ApuestasService;
  let mockConnection: any;
  let mockSession: any;
  let mockTicketModel: any;
  let mockMercadoModel: any;
  let mockBilleteraService: any;
  let mockEventosCollection: any;

  const eventoIdValido = '670800000000000000000001';

  const dtoBase: CreateApuestaDto = {
    eventoId: eventoIdValido,
    seleccion: 'LOCAL',
    montoCentavos: 2500, // $25.00 USD
    cuotasVersion: 1,
    idempotencyKey: 'uuid-test-1234',
  };

  beforeEach(() => {
    mockSession = {
      withTransaction: vi.fn(async (cb: () => Promise<void>) => {
        await cb();
      }),
      endSession: vi.fn().mockResolvedValue(undefined),
    };

    mockEventosCollection = {
      findOne: vi.fn().mockResolvedValue({
        equipoLocal: 'Real Madrid',
        equipoVisitante: 'Manchester City',
        liga: 'UEFA Champions League',
      }),
    };

    mockConnection = {
      startSession: vi.fn().mockResolvedValue(mockSession),
      collection: vi.fn().mockReturnValue(mockEventosCollection),
    };

    mockTicketModel = {
      findOne: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
    };

    mockMercadoModel = {
      findOne: vi.fn(),
    };

    mockBilleteraService = {
      debitarSaldo: vi.fn().mockResolvedValue({ saldoCentavos: 97500 }),
    };

    service = new ApuestasService(
      mockConnection,
      mockTicketModel,
      mockMercadoModel,
      mockBilleteraService,
    );
  });

  it('debe emitir un ticket nuevo en transacción ACID y calcular ganancia en centavos enteros (201)', async () => {
    mockTicketModel.findOne.mockResolvedValue(null);
    mockMercadoModel.findOne.mockResolvedValue({
      estadoMercado: 'ABIERTO',
      cuotasVersion: 1,
      cuotas: { local: 2.1, empate: 3.4, visitante: 3.25 },
    });

    const ticketCreado = {
      _id: 'ticket-1',
      usuarioId: 'usr-demo',
      eventoId: eventoIdValido,
      eventoResumen: {
        partido: 'Real Madrid vs Manchester City',
        liga: 'UEFA Champions League',
      },
      seleccion: 'LOCAL',
      cuotaJugada: 2.1,
      cuotasVersion: 1,
      montoCentavos: 2500,
      gananciaPotencialCentavos: 5250,
      estado: 'PENDIENTE',
      idempotencyKey: dtoBase.idempotencyKey,
    };
    mockTicketModel.create.mockResolvedValue([ticketCreado]);

    const resultado = await service.crearApuesta('usr-demo', dtoBase);

    expect(resultado.esNuevo).toBe(true);
    expect(resultado.ticket).toEqual(ticketCreado);
    expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
    expect(mockBilleteraService.debitarSaldo).toHaveBeenCalledWith(
      'usr-demo',
      2500,
      dtoBase.idempotencyKey,
      mockSession,
    );
    expect(mockSession.endSession).toHaveBeenCalledTimes(1);
  });

  it('debe retornar el ticket existente con esNuevo=false sin volver a debitar si idempotencyKey ya existe (RNF04)', async () => {
    const ticketPrevia = {
      _id: 'ticket-existente',
      idempotencyKey: dtoBase.idempotencyKey,
      montoCentavos: 2500,
    };
    mockTicketModel.findOne.mockResolvedValue(ticketPrevia);

    const resultado = await service.crearApuesta('usr-demo', dtoBase);

    expect(resultado.esNuevo).toBe(false);
    expect(resultado.ticket).toBe(ticketPrevia);
    expect(mockBilleteraService.debitarSaldo).not.toHaveBeenCalled();
    expect(mockConnection.startSession).not.toHaveBeenCalled();
  });

  it('debe rechazar con HTTP 423 Locked cuando el mercado está SUSPENDIDO (ADR-002)', async () => {
    mockTicketModel.findOne.mockResolvedValue(null);
    mockMercadoModel.findOne.mockResolvedValue({
      estadoMercado: 'SUSPENDIDO',
      cuotasVersion: 1,
      cuotas: { local: 2.1, empate: 3.4, visitante: 3.25 },
    });

    await expect(service.crearApuesta('usr-demo', dtoBase)).rejects.toMatchObject({
      status: HttpStatus.LOCKED,
    });
    expect(mockBilleteraService.debitarSaldo).not.toHaveBeenCalled();
  });

  it('debe rechazar con HTTP 409 Conflict cuando cuotasVersion no coincide con la versión actual (RNF03)', async () => {
    mockTicketModel.findOne.mockResolvedValue(null);
    mockMercadoModel.findOne.mockResolvedValue({
      estadoMercado: 'ABIERTO',
      cuotasVersion: 2,
      cuotas: { local: 1.85, empate: 3.5, visitante: 4.0 },
    });

    try {
      await service.crearApuesta('usr-demo', dtoBase);
      expect.unreachable('Debió lanzar ConflictException');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      const response = (err as ConflictException).getResponse() as any;
      expect(response.statusCode).toBe(409);
      expect(response.cuotasVersionActual).toBe(2);
      expect(response.cuotaActualizada.local).toBe(1.85);
    }
  });

  it('debe abortar la transacción y cerrar la sesión si BilleteraService lanza saldo insuficiente (HTTP 400)', async () => {
    mockTicketModel.findOne.mockResolvedValue(null);
    mockMercadoModel.findOne.mockResolvedValue({
      estadoMercado: 'ABIERTO',
      cuotasVersion: 1,
      cuotas: { local: 2.1, empate: 3.4, visitante: 3.25 },
    });
    mockBilleteraService.debitarSaldo.mockRejectedValue(
      new BadRequestException('Saldo insuficiente o billetera bloqueada'),
    );

    await expect(service.crearApuesta('usr-demo', dtoBase)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockTicketModel.create).not.toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalledTimes(1);
  });

  it('debe retornar el historial ordenado por createdAt descendente', async () => {
    const execMock = vi.fn().mockResolvedValue([{ _id: 't1' }, { _id: 't2' }]);
    const sortMock = vi.fn().mockReturnValue({ exec: execMock });
    mockTicketModel.find.mockReturnValue({ sort: sortMock });

    const historial = await service.obtenerHistorial('usr-demo');

    expect(mockTicketModel.find).toHaveBeenCalledWith({ usuarioId: 'usr-demo' });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(historial).toHaveLength(2);
  });
});
