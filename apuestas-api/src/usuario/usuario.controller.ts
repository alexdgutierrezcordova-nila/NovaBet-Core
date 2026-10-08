import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsuarioService } from './usuario.service.js';
import { RecargarSaldoDto } from './dto/recargar-saldo.dto.js';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('perfil')
  obtenerPerfil() {
    return this.usuarioService.obtenerPerfil('usr-demo');
  }

  @Post('recargar')
  recargarSaldo(@Body() dto: RecargarSaldoDto) {
    return this.usuarioService.recargarSaldo('usr-demo', dto.monto);
  }
}
