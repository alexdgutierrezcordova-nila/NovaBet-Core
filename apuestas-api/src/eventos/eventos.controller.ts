import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventosService } from './eventos.service';
import { UpdateResultadoDto } from './dto/update-resultado.dto';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  obtenerEventos(): Promise<any[]> {
    return this.eventosService.obtenerEventos();
  }

  @Get(':id')
  obtenerEventoPorId(@Param('id') id: string): Promise<any> {
    return this.eventosService.obtenerEventoPorId(id);
  }

  @Patch(':id/resultado')
  @HttpCode(HttpStatus.OK)
  actualizarResultado(
    @Param('id') id: string,
    @Body() dto: UpdateResultadoDto,
  ) {
    return this.eventosService.actualizarResultado(
      id,
      dto.resultado,
      dto.marcadorFinal,
    );
  }
}
