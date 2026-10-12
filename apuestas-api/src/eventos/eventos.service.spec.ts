import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { EventosService } from './eventos.service';
import { Evento } from './schemas/evento.schema';
import { Mercado } from '../cuotas/schemas/mercado.schema';
import { Ticket } from '../apuestas/schemas/ticket.schema';
import { BilleteraService } from '../billetera/billetera.service';
import { Types } from 'mongoose';

describe('EventosService', () => {
  let service: EventosService;
  let mockEventoModel: any;
  let mockMercadoModel: any;
  let mockTicketModel: any;
  let mockBilleteraService: any;

  const eventoId = new Types.ObjectId();
  const mockEvento = {
    _id: eventoId,
    equipoLocal: 'Real Madrid',
    equipoVisitante: 'Manchester City',
    estado: 'LIVE',
    resultado: 'SIN_RESULTADO',
    save: vi.fn().mockResolvedValue(true),
  };

  const mockTicketGanador = {
    _id: 'tkt-ganador',
    usuarioId: 'usr-demo',
    eventoId,
    seleccion: 'LOCAL',
    montoCentavos: 1000,
    gananciaPotencialCentavos: 2150,
    estado: 'PENDIENTE',
    save: vi.fn().mockResolvedValue(true),
  };

  const mockTicketPerdedor = {
    _id: 'tkt-perdedor',
    usuarioId: 'usr-demo',
    eventoId,
    seleccion: 'VISITANTE',
    montoCentavos: 1000,
    gananciaPotencialCentavos: 3400,
    estado: 'PENDIENTE',
    save: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockEventoModel = {
      countDocuments: vi.fn().mockResolvedValue(4),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([mockEvento]),
          }),
        }),
      }),
      findById: vi.fn().mockResolvedValue(mockEvento),
      create: vi.fn(),
    };

    mockMercadoModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue({
            eventoId,
            estadoMercado: 'ABIERTO',
            cuotas: { local: 2.15, empate: 3.5, visitante: 3.4 },
          }),
        }),
      }),
      create: vi.fn(),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockTicketModel = {
      find: vi.fn().mockResolvedValue([mockTicketGanador, mockTicketPerdedor]),
    };

    mockBilleteraService = {
      recargarSaldo: vi.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventosService,
        {
          provide: getModelToken(Evento.name),
          useValue: mockEventoModel,
        },
        {
          provide: getModelToken(Mercado.name),
          useValue: mockMercadoModel,
        },
        {
          provide: getModelToken(Ticket.name),
          useValue: mockTicketModel,
        },
        {
          provide: BilleteraService,
          useValue: mockBilleteraService,
        },
      ],
    }).compile();

    service = module.get<EventosService>(EventosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe obtener la lista de eventos con sus mercados', async () => {
    const eventos = await service.obtenerEventos();
    expect(eventos).toHaveLength(1);
    expect(eventos[0].equipoLocal).toBe('Real Madrid');
    expect(eventos[0].mercado).toBeDefined();
  });

  it('debe actualizar resultado a FINALIZADO, cerrar mercado y liquidar tickets (RF1.4)', async () => {
    const resultado = await service.actualizarResultado(
      eventoId.toString(),
      'LOCAL',
      '2 - 1',
    );

    expect(resultado.estado).toBe('FINALIZADO');
    expect(resultado.resultado).toBe('LOCAL');
    expect(resultado.marcadorFinal).toBe('2 - 1');
    expect(mockEvento.save).toHaveBeenCalled();

    // Mercado cerrado
    expect(mockMercadoModel.updateOne).toHaveBeenCalledWith(
      { eventoId },
      expect.objectContaining({
        $set: { estadoMercado: 'CERRADO' },
      }),
    );

    // Ticket ganador resuelto y premiado
    expect(mockTicketGanador.estado).toBe('GANADA');
    expect(mockTicketGanador.save).toHaveBeenCalled();
    expect(mockBilleteraService.recargarSaldo).toHaveBeenCalledWith(
      'usr-demo',
      2150,
    );

    // Ticket perdedor resuelto sin premio
    expect(mockTicketPerdedor.estado).toBe('PERDIDA');
    expect(mockTicketPerdedor.save).toHaveBeenCalled();
  });
});
