import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BilleteraModule } from './billetera/billetera.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/novabet'),
    BilleteraModule, // Módulo 3: Billetera Virtual y Libro Mayor (Ledger)
    // EventosModule, // Módulo 1 (Integrante 1)
    // ApuestasModule, // Módulo 2 (Carlos)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
