import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  OnModuleInit 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import * as crypto from 'crypto';
import { Billetera, BilleteraDocument } from './schemas/billetera.schema';
import { Transaccion, TransaccionDocument } from './schemas/transaccion.schema';

/**
 * @class BilleteraService
 * @description Servicio de dominio financiero para la gestión de saldos y auditoría contable.
 * 
 * PATRONES Y DECISIONES ARQUITECTÓNICAS:
 * 1. Monolito Modular con Límite Transaccional ACID (ADR-001):
 *    Los métodos de mutación aceptan un parámetro opcional `session?: ClientSession`.
 *    Esto permite que el Módulo de Apuestas (Carlos) ejecute débitos de saldo
 *    dentro de la misma transacción atómica de MongoDB (`session.withTransaction()`).
 * 
 * 2. Cero Flotantes (Zero-Floats):
 *    Todas las operaciones aritméticas ocurren exclusivamente sobre números enteros en centavos.
 * 
 * 3. Libro Mayor Inmutable (Ledger Pattern):
 *    Ningún saldo se altera sin registrar simultáneamente el movimiento contable
 *    correspondiente en la colección `transacciones` con referencia única.
 */
@Injectable()
export class BilleteraService implements OnModuleInit {
  constructor(
    @InjectModel(Billetera.name) 
    private readonly billeteraModel: Model<BilleteraDocument>,

    @InjectModel(Transaccion.name) 
    private readonly transaccionModel: Model<TransaccionDocument>
  ) {}

  /**
   * Seeder automático en el ciclo de vida de NestJS.
   * Garantiza que exista el usuario demo ('usr-demo') con su saldo inicial
   * de $1,000.00 USD (100,000 centavos) auditado en el Libro Mayor.
   */
  async onModuleInit(): Promise<void> {
    const demo = await this.billeteraModel.findOne({ usuarioId: 'usr-demo' }).exec();
    
    if (!demo) {
      await this.billeteraModel.create({
        usuarioId: 'usr-demo',
        saldoCentavos: 100000, // $1,000.00 USD
        bloqueada: false
      });

      // Registro inicial en el Libro Mayor para trazabilidad contable
      await this.transaccionModel.create({
        usuarioId: 'usr-demo',
        tipo: 'RECARGA',
        montoCentavos: 100000,
        referenciaIdempotente: 'seed-inicial-usr-demo'
      });

      console.log('✅ [BilleteraService]: Billetera demo creada con $1,000.00 USD (100,000 centavos) y auditada en el Ledger.');
    }
  }

  /**
   * Consulta el saldo actual y estado de bloqueo de la billetera.
   * @param usuarioId Identificador del usuario (por defecto 'usr-demo')
   * @returns Documento de la billetera
   */
  async obtenerBalance(usuarioId = 'usr-demo'): Promise<Billetera> {
    const billetera = await this.billeteraModel.findOne({ usuarioId }).exec();

    if (!billetera) {
      throw new NotFoundException(`No se encontró billetera para el usuario '${usuarioId}'`);
    }

    return billetera;
  }

  /**
   * Débito atómico de saldo utilizado por el Módulo de Apuestas (M2 - Carlos).
   * 
   * @param usuarioId ID del usuario
   * @param montoCentavos Importe a descontar (en centavos enteros)
   * @param referenciaIdempotente Clave única generada por la operación
   * @param session Sesión opcional de MongoDB para soportar transacciones ACID
   * @returns Documento actualizado de la billetera
   * @throws BadRequestException Si la cuenta está bloqueada o los fondos son insuficientes
   */
  async debitarSaldo(
    usuarioId: string,
    montoCentavos: number,
    referenciaIdempotente: string,
    session?: ClientSession
  ): Promise<Billetera> {
    if (montoCentavos <= 0) {
      throw new BadRequestException('El monto a debitar debe ser mayor a 0');
    }

    // 1. Operación atómica condicionada con $inc negativo
    // Solo actualiza si la cuenta NO está bloqueada y tiene fondos >= montoCentavos
    const billeteraActualizada = await this.billeteraModel.findOneAndUpdate(
      {
        usuarioId,
        bloqueada: false,
        saldoCentavos: { $gte: montoCentavos }
      },
      { 
        $inc: { saldoCentavos: -montoCentavos } 
      },
      { 
        new: true, 
        session 
      }
    ).exec();

    // Si no encontró documento coincidente, evaluamos la causa específica
    if (!billeteraActualizada) {
      const billeteraExistente = await this.billeteraModel.findOne({ usuarioId }, null, { session }).exec();
      
      if (!billeteraExistente) {
        throw new NotFoundException(`Billetera no encontrada para el usuario '${usuarioId}'`);
      }
      if (billeteraExistente.bloqueada) {
        throw new BadRequestException('Operación rechazada: La cuenta se encuentra bloqueada');
      }
      throw new BadRequestException('Saldo insuficiente o billetera bloqueada');
    }

    // 2. Asiento contable en el Libro Mayor (Ledger) dentro de la MISMA sesión
    await this.transaccionModel.create(
      [
        {
          usuarioId,
          tipo: 'APUESTA',
          montoCentavos: -montoCentavos, // Salida contable en negativo
          referenciaIdempotente
        }
      ],
      { session }
    );

    return billeteraActualizada;
  }

  /**
   * Recarga de saldo virtual en centavos con asiento contable en el Ledger.
   * 
   * @param usuarioId ID del usuario a recargar
   * @param montoCentavos Importe a recargar (por defecto 50000 = $500.00 USD)
   * @returns Documento de la billetera con el nuevo saldo
   */
  async recargarSaldo(
    usuarioId = 'usr-demo',
    montoCentavos = 50000
  ): Promise<Billetera> {
    if (montoCentavos <= 0) {
      throw new BadRequestException('El monto de recarga debe ser positivo');
    }

    const ref = `recarga-${Date.now()}-${crypto.randomUUID()}`;

    // 1. Acreditar saldo en la billetera
    const billetera = await this.billeteraModel.findOneAndUpdate(
      { usuarioId },
      { 
        $inc: { saldoCentavos: montoCentavos } 
      },
      { 
        new: true,
        upsert: true
      }
    ).exec();

    if (!billetera) {
      throw new NotFoundException(`Error al procesar recarga para usuario '${usuarioId}'`);
    }

    // 2. Asentar en el Libro Mayor
    await this.transaccionModel.create({
      usuarioId,
      tipo: 'RECARGA',
      montoCentavos,
      referenciaIdempotente: ref
    });

    return billetera;
  }

  /**
   * Acredita ganancias por liquidación de apuesta ganadora.
   * Utilizado cuando el Módulo 1 (Eventos) o Módulo 2 resuelven boletos.
   * 
   * @param usuarioId ID del usuario beneficiario
   * @param montoCentavos Importe ganado en centavos
   * @param ticketId Identificador del boleto premiado
   * @param referenciaIdempotente Clave única de liquidación
   * @param session Sesión transaccional opcional
   */
  async acreditarPremio(
    usuarioId: string,
    montoCentavos: number,
    ticketId: string,
    referenciaIdempotente: string,
    session?: ClientSession
  ): Promise<Billetera> {
    if (montoCentavos <= 0) {
      throw new BadRequestException('El monto del premio debe ser mayor a 0');
    }

    const billetera = await this.billeteraModel.findOneAndUpdate(
      { usuarioId },
      { 
        $inc: { saldoCentavos: montoCentavos } 
      },
      { 
        new: true,
        session 
      }
    ).exec();

    if (!billetera) {
      throw new NotFoundException(`Billetera no encontrada para usuario '${usuarioId}'`);
    }

    await this.transaccionModel.create(
      [
        {
          usuarioId,
          tipo: 'PREMIO',
          montoCentavos,
          ticketId,
          referenciaIdempotente
        }
      ],
      { session }
    );

    return billetera;
  }

  /**
   * Reembolsa el monto apostado en caso de evento anulado o suspendido definitivamente.
   */
  async reembolsarSaldo(
    usuarioId: string,
    montoCentavos: number,
    ticketId: string,
    referenciaIdempotente: string,
    session?: ClientSession
  ): Promise<Billetera> {
    const billetera = await this.billeteraModel.findOneAndUpdate(
      { usuarioId },
      { 
        $inc: { saldoCentavos: montoCentavos } 
      },
      { 
        new: true,
        session 
      }
    ).exec();

    if (!billetera) {
      throw new NotFoundException(`Billetera no encontrada para usuario '${usuarioId}'`);
    }

    await this.transaccionModel.create(
      [
        {
          usuarioId,
          tipo: 'REEMBOLSO',
          montoCentavos,
          ticketId,
          referenciaIdempotente
        }
      ],
      { session }
    );

    return billetera;
  }
}
