import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApuestasService } from './apuestas.service.js';
import { CreateApuestaDto } from './dto/create-apuesta.dto.js';

@Controller('apuestas')
export class ApuestasController {
  constructor(private readonly apuestasService: ApuestasService) {}

  @Post()
  crearApuesta(@Body() dto: CreateApuestaDto) {
    return this.apuestasService.crearApuesta(dto, 'usr-demo');
  }

  @Get('historial')
  listarHistorial() {
    return this.apuestasService.listarHistorial('usr-demo');
  }
}
