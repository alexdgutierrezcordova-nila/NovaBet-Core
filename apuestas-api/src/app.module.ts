import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApuestasModule } from './apuestas/apuestas.module';
import { BilleteraModule } from './billetera/billetera.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/novabet'),
    ApuestasModule, // Módulo 2: Apuestas y Betslip (Carlos)
    BilleteraModule, // Módulo 3: Billetera Virtual y Libro Mayor (Luis)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
