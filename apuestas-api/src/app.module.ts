import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EventosModule } from './eventos/eventos.module.js';
import { UsuarioModule } from './usuario/usuario.module.js';
import { ApuestasModule } from './apuestas/apuestas.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/betpulse'),
    EventosModule,
    UsuarioModule,
    ApuestasModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
