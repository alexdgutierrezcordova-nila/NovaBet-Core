import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Billetera, BilleteraDocument } from './schemas/billetera.schema';
import { Transaccion, TransaccionDocument } from './schemas/transaccion.schema';

@Injectable()
export class BilleteraService implements OnModuleInit {
  constructor(
    @InjectModel(Billetera.name)
    private readonly billeteraModel: Model<BilleteraDocument>,
    @InjectModel(Transaccion.name)
    private readonly transaccionModel: Model<TransaccionDocument>,
  ) {}

  async onModuleInit() {
    const demo = await this.billeteraModel.findOne({ usuarioId: 'usr-demo' });
    if (!demo) {
      await this.billeteraModel.create({
        usuarioId: 'usr-demo',
        saldoCentavos: 100000, // $1,000.00 USD inicial
        bloqueada: false,
      });
      console.log(
        '✅ [Seed]: Billetera inicial creada con $1,000.00 USD (100,000 centavos).',
      );
    }
  }

  async obtenerBalance(usuarioId = 'usr-demo') {
    return this.billeteraModel.findOne({ usuarioId }).exec();
  }

  // Débito transaccional llamado por el Módulo 2 de Carlos
  async debitarSaldo(
    usuarioId: string,
    montoCentavos: number,
    referenciaIdempotente: string,
    session?: ClientSession,
  ) {
    // 1. Descontar saldo de forma atómica condicionada
    const res = await this.billeteraModel.findOneAndUpdate(
      {
        usuarioId,
        bloqueada: false,
        saldoCentavos: { $gte: montoCentavos },
      },
      { $inc: { saldoCentavos: -montoCentavos } },
      { new: true, session },
    );

    if (!res) {
      throw new BadRequestException(
        'Saldo insuficiente o billetera bloqueada',
      );
    }

    // 2. Registrar en el Ledger dentro de la MISMA sesión
    await this.transaccionModel.create(
      [
        {
          usuarioId,
          tipo: 'APUESTA',
          montoCentavos: -montoCentavos,
          referenciaIdempotente,
        },
      ],
      { session },
    );

    return res;
  }

  // Recarga simple de saldo
  async recargarSaldo(usuarioId = 'usr-demo', montoCentavos = 50000) {
    const ref = `recarga-${Date.now()}-${crypto.randomUUID()}`;
    const billetera = await this.billeteraModel.findOneAndUpdate(
      { usuarioId },
      { $inc: { saldoCentavos: montoCentavos } },
      { new: true },
    );

    await this.transaccionModel.create({
      usuarioId,
      tipo: 'RECARGA',
      montoCentavos,
      referenciaIdempotente: ref,
    });

    return billetera;
  }
}
