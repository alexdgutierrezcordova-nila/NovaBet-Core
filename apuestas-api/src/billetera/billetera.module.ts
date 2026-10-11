import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Billetera, BilleteraSchema } from './schemas/billetera.schema';
import { Transaccion, TransaccionSchema } from './schemas/transaccion.schema';
import { BilleteraService } from './billetera.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Billetera.name, schema: BilleteraSchema },
      { name: Transaccion.name, schema: TransaccionSchema },
    ]),
  ],
  providers: [BilleteraService],
  exports: [BilleteraService],
})
export class BilleteraModule {}
