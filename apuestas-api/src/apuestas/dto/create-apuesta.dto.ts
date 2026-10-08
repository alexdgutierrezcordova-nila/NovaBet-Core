import { IsIn, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateApuestaDto {
  @IsNotEmpty()
  @IsString()
  eventoId: string;

  @IsNotEmpty()
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'])
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsNumber()
  @IsPositive({ message: 'El monto de la apuesta debe ser mayor a 0' })
  monto: number;
}
