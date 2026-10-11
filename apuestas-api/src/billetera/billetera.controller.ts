import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BilleteraService } from './billetera.service.js';
import { Billetera } from './schemas/billetera.schema.js';
import { RecargarSaldoDto } from './dto/recargar-saldo.dto.js';

/**
 * @class BilleteraController
 * @description Controlador REST para la gestión de balances financieros y recargas.
 * Expuesto bajo el prefijo global `/api/billetera`.
 */
@Controller('billetera')
export class BilleteraController {
  constructor(private readonly billeteraService: BilleteraService) {}

  /**
   * Endpoint GET /api/billetera/balance
   * Permite consultar el saldo actual en centavos y el estado de la cuenta.
   * 
   * @param usuarioId Parámetro opcional en query string (por defecto 'usr-demo')
   * @returns Datos de la billetera con saldoCentavos y bandera bloqueada
   * 
   * @example
   * GET /api/billetera/balance
   * Response 200 OK:
   * {
   *   "_id": "...",
   *   "usuarioId": "usr-demo",
   *   "saldoCentavos": 100000,
   *   "bloqueada": false
   * }
   */
  @Get('balance')
  async obtenerBalance(
    @Query('usuarioId') usuarioId = 'usr-demo'
  ): Promise<Billetera> {
    return this.billeteraService.obtenerBalance(usuarioId);
  }

  /**
   * Endpoint POST /api/billetera/recargar
   * Permite añadir fondos virtuales a la billetera en centavos enteros
   * y asienta la operación en el Libro Mayor (Ledger).
   * 
   * @param dto Datos validados de la recarga (montoCentavos > 0, usuarioId opcional)
   * @returns Documento de la billetera con el saldo actualizado
   * 
   * @example
   * POST /api/billetera/recargar
   * Body: { "montoCentavos": 50000 } // $500.00 USD
   * Response 200 OK:
   * {
   *   "_id": "...",
   *   "usuarioId": "usr-demo",
   *   "saldoCentavos": 150000,
   *   "bloqueada": false
   * }
   */
  @Post('recargar')
  @HttpCode(HttpStatus.OK)
  async recargarSaldo(
    @Body() dto: RecargarSaldoDto
  ): Promise<Billetera> {
    const usuarioId = dto.usuarioId ?? 'usr-demo';
    return this.billeteraService.recargarSaldo(usuarioId, dto.montoCentavos);
  }
}
