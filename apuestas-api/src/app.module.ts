import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApuestasModule } from './apuestas/apuestas.module';
import { EventosModule } from './eventos/eventos.module';
import { CuotasModule } from './cuotas/cuotas.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/novabet'),
    EventosModule,
    CuotasModule,
    ApuestasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
