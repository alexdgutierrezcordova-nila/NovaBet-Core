import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CuotasController } from './cuotas.controller';
import { CuotasService } from './cuotas.service';
import { Mercado, MercadoSchema } from './schemas/mercado.schema';
import { Evento, EventoSchema } from '../eventos/schemas/evento.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mercado.name, schema: MercadoSchema },
      { name: Evento.name, schema: EventoSchema },
    ]),
  ],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService, MongooseModule],
})
export class CuotasModule {}
