import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { EventosService } from './eventos.service.js';
import { UpdateResultadoDto } from './dto/update-resultado.dto.js';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  listarTodos() {
    return this.eventosService.listarTodos();
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.eventosService.obtenerPorId(id);
  }

  @Patch(':id/resultado')
  actualizarResultado(
    @Param('id') id: string,
    @Body() dto: UpdateResultadoDto
  ) {
    return this.eventosService.actualizarResultado(id, dto);
  }
}
