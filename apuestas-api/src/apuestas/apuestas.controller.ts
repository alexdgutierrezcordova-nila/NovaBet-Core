import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApuestasService } from './apuestas.service';
import { CreateApuestaDto } from './dto/create-apuesta.dto';

@Controller('apuestas')
export class ApuestasController {
  private readonly usuarioDemo = 'usr-demo';

  constructor(private readonly apuestasService: ApuestasService) {}

  @Post()
  async crearApuesta(@Body() dto: CreateApuestaDto) {
    return this.apuestasService.crearApuesta(this.usuarioDemo, dto);
  }

  @Get('historial')
  async obtenerHistorial() {
    return this.apuestasService.obtenerHistorial(this.usuarioDemo);
  }
}
