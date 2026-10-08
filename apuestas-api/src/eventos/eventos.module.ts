import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Evento, EventoSchema } from './schemas/evento.schema.js';
import { EventosService } from './eventos.service.js';
import { EventosController } from './eventos.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Evento.name, schema: EventoSchema }])
  ],
  controllers: [EventosController],
  providers: [EventosService],
  exports: [EventosService, MongooseModule]
})
export class EventosModule {}
