import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApuestasService } from './apuestas.service';
import { CreateApuestaDto } from './dto/create-apuesta.dto';

@Controller('apuestas')
export class ApuestasController {
  private readonly usuarioDemo = 'usr-demo';

  constructor(private readonly apuestasService: ApuestasService) {}

  /**
   * POST /api/apuestas
   *
   * Emite un ticket de apuesta de forma atómica (ACID) junto con el débito de saldo.
   *
   * Respuestas:
   *  - 201 Created   → Ticket nuevo emitido con éxito
   *  - 200 OK        → idempotencyKey ya fue procesada: devuelve el ticket existente (RNF04)
   *  - 400 Bad Request → Saldo insuficiente o datos inválidos
   *  - 409 Conflict  → cuotasVersion no coincide con la versión actual en BD (RNF03)
   *  - 423 Locked    → Mercado SUSPENDIDO o CERRADO (ADR-002)
   */
  @Post()
  async crearApuesta(
    @Body() dto: CreateApuestaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.apuestasService.crearApuesta(
      this.usuarioDemo,
      dto,
    );

    // RNF04 — Idempotencia: ticket ya existía → 200 OK en lugar de 201 Created
    if (!resultado.esNuevo) {
      res.status(HttpStatus.OK);
    } else {
      res.status(HttpStatus.CREATED);
    }

    return resultado.ticket;
  }

  /**
   * GET /api/apuestas/historial
   *
   * Retorna todos los tickets del usuario demo ordenados por fecha descendente.
   */
  @Get('historial')
  @HttpCode(HttpStatus.OK)
  async obtenerHistorial() {
    return this.apuestasService.obtenerHistorial(this.usuarioDemo);
  }
}
