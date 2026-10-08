import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evento, EventoDocument } from './schemas/evento.schema.js';
import { UpdateResultadoDto } from './dto/update-resultado.dto.js';
import { EVENTOS_INICIALES } from './seeds/eventos.seed.js';

@Injectable()
export class EventosService implements OnModuleInit {
  constructor(
    @InjectModel(Evento.name) private readonly eventoModel: Model<EventoDocument>
  ) {}

  async onModuleInit() {
    const count = await this.eventoModel.countDocuments();
    if (count === 0) {
      await this.eventoModel.insertMany(EVENTOS_INICIALES);
      console.log('✅ [Seed]: Eventos deportivos iniciales insertados en MongoDB.');
    }
  }

  async listarTodos(): Promise<Evento[]> {
    return this.eventoModel.find().sort({ fecha: 1 }).exec();
  }

  async obtenerPorId(id: string): Promise<Evento> {
    const evento = await this.eventoModel.findById(id).exec();
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }
    return evento;
  }

  async actualizarResultado(id: string, dto: UpdateResultadoDto): Promise<Evento> {
    const evento = await this.eventoModel.findByIdAndUpdate(
      id,
      {
        estado: 'FINALIZADO',
        resultado: dto.resultado,
        marcadorFinal: dto.marcadorFinal || ''
      },
      { new: true }
    ).exec();

    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    return evento;
  }
}
