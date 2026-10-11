import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Billetera, BilleteraSchema } from './schemas/billetera.schema.js';
import { Transaccion, TransaccionSchema } from './schemas/transaccion.schema.js';
import { BilleteraService } from './billetera.service.js';
import { BilleteraController } from './billetera.controller.js';

/**
 * @class BilleteraModule
 * @description Módulo de NestJS para el dominio financiero de la plataforma.
 * 
 * ARQUITECTURA (Modular Monolith):
 * Encapsula la persistencia de las colecciones `billeteras` y `transacciones`,
 * sus controladores REST y la lógica de negocio contable.
 * 
 * EXPORTACIÓN CLAVE:
 * Exporta `BilleteraService` para que el Módulo de Apuestas (Módulo 2 - Carlos)
 * pueda inyectarlo y realizar débitos dentro de transacciones atómicas de MongoDB.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Billetera.name, schema: BilleteraSchema },
      { name: Transaccion.name, schema: TransaccionSchema }
    ])
  ],
  controllers: [BilleteraController],
  providers: [BilleteraService],
  exports: [BilleteraService]
})
export class BilleteraModule {}
