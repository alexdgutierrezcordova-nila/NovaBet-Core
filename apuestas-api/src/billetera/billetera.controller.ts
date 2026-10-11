import { Controller, Get, Query } from '@nestjs/common';
import { BilleteraService } from './billetera.service.js';
import { Billetera } from './schemas/billetera.schema.js';

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
}
