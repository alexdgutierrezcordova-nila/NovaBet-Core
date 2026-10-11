import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { EventosService } from './eventos.service';
import { Evento } from './schemas/evento.schema';
import { Mercado } from '../cuotas/schemas/mercado.schema';

describe('EventosService', () => {
  let service: EventosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventosService,
        {
          provide: getModelToken(Evento.name),
          useValue: {
            countDocuments: vi.fn().mockResolvedValue(4),
            find: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: getModelToken(Mercado.name),
          useValue: {
            findOne: vi.fn(),
            create: vi.fn(),
            updateOne: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventosService>(EventosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
