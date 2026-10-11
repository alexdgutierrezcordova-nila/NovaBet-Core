import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { Evento, EventoSchema } from './schemas/evento.schema';
import { Mercado, MercadoSchema } from '../cuotas/schemas/mercado.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evento.name, schema: EventoSchema },
      { name: Mercado.name, schema: MercadoSchema },
    ]),
  ],
  controllers: [EventosController],
  providers: [EventosService],
  exports: [EventosService, MongooseModule],
})
export class EventosModule {}
