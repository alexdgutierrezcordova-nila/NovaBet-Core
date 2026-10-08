import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schemas/ticket.schema.js';
import { ApuestasService } from './apuestas.service.js';
import { ApuestasController } from './apuestas.controller.js';
import { EventosModule } from '../eventos/eventos.module.js';
import { UsuarioModule } from '../usuario/usuario.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    EventosModule,
    UsuarioModule
  ],
  controllers: [ApuestasController],
  providers: [ApuestasService],
  exports: [ApuestasService]
})
export class ApuestasModule {}
