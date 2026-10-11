import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { Mercado, MercadoSchema } from '../cuotas/schemas/mercado.schema';
import { BilleteraModule } from '../billetera/billetera.module';
import { ApuestasService } from './apuestas.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Mercado.name, schema: MercadoSchema },
    ]),
    BilleteraModule,
  ],
  controllers: [],
  providers: [ApuestasService],
})
export class ApuestasModule {}
