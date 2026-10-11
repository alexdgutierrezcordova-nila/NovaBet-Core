import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

/**
 * @class RecargarSaldoDto
 * @description Data Transfer Object (DTO) para la petición de recarga de saldo virtual.
 * 
 * Cumple con el estándar Zero-Floats:
 * El monto recibido se valida estrictamente como un NÚMERO ENTERO EN CENTAVOS.
 * Ejemplo: Para recargar $500.00 USD, el cliente envía 50000.
 */
export class RecargarSaldoDto {
  /**
   * Monto a recargar expresado en centavos enteros.
   * Debe ser un número entero estrictamente positivo (> 0).
   * @example 50000 ($500.00 USD)
   */
  @IsInt({ message: 'El monto a recargar debe ser un número entero en centavos' })
  @IsPositive({ message: 'El monto de recarga debe ser mayor a 0' })
  montoCentavos: number;

  /**
   * Identificador del usuario (opcional en el body, por defecto 'usr-demo').
   */
  @IsOptional()
  @IsString({ message: 'El usuarioId debe ser una cadena de texto' })
  usuarioId?: string;
}
