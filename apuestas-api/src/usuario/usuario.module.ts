import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema.js';
import { UsuarioService } from './usuario.service.js';
import { UsuarioController } from './usuario.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }])
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService, MongooseModule]
})
export class UsuarioModule {}
