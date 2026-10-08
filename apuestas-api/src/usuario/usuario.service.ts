import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

@Injectable()
export class UsuarioService implements OnModuleInit {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<UsuarioDocument>
  ) {}

  async onModuleInit() {
    const demo = await this.usuarioModel.findOne({ usuarioId: 'usr-demo' });
    if (!demo) {
      await this.usuarioModel.create({
        usuarioId: 'usr-demo',
        nombre: 'Apostador Demo',
        email: 'demo@betpulse.com',
        saldo: 1000.00
      });
      console.log('✅ [Seed]: Usuario demo inicial creado con $1000 de saldo.');
    }
  }

  async obtenerPerfil(usuarioId = 'usr-demo'): Promise<Usuario> {
    const usuario = await this.usuarioModel.findOne({ usuarioId }).exec();
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return usuario;
  }

  async recargarSaldo(usuarioId = 'usr-demo', monto: number): Promise<Usuario> {
    const usuario = await this.usuarioModel.findOneAndUpdate(
      { usuarioId },
      { $inc: { saldo: monto } },
      { new: true }
    ).exec();

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    return usuario;
  }

  async debitarSaldo(usuarioId = 'usr-demo', monto: number): Promise<Usuario> {
    const usuario = await this.obtenerPerfil(usuarioId);
    if (usuario.saldo < monto) {
      throw new BadRequestException('Saldo insuficiente para realizar la apuesta');
    }

    const actualizado = await this.usuarioModel.findOneAndUpdate(
      { usuarioId, saldo: { $gte: monto } },
      { $inc: { saldo: -monto } },
      { new: true }
    ).exec();

    if (!actualizado) {
      throw new BadRequestException('Error de concurrencia o saldo insuficiente');
    }

    return actualizado;
  }

  async acreditarSaldo(usuarioId = 'usr-demo', monto: number): Promise<Usuario> {
    const actualizado = await this.usuarioModel.findOneAndUpdate(
      { usuarioId },
      { $inc: { saldo: monto } },
      { new: true }
    ).exec();

    if (!actualizado) {
      throw new BadRequestException('Usuario no encontrado');
    }

    return actualizado;
  }
}
