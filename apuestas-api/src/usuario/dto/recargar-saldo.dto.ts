import { IsNumber, IsPositive } from 'class-validator';

export class RecargarSaldoDto {
  @IsNumber()
  @IsPositive({ message: 'El monto de recarga debe ser positivo' })
  monto: number;
}
