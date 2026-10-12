import { IsIn, IsInt, IsNotEmpty, IsPositive, IsString, Min } from 'class-validator';

export class CreateApuestaDto {
  @IsNotEmpty({ message: 'El identificador del evento es obligatorio' })
  @IsString({ message: 'El identificador del evento debe ser texto' })
  eventoId: string;

  @IsNotEmpty({ message: 'La selección es obligatoria' })
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'], {
    message: 'La selección debe ser LOCAL, EMPATE o VISITANTE',
  })
  seleccion: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsInt({ message: 'El monto debe expresarse en centavos enteros' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @Min(100, { message: 'El monto mínimo de apuesta es 100 centavos ($1.00 USD)' })
  montoCentavos: number;

  @IsInt({ message: 'La versión de cuotas debe ser un número entero' })
  @IsPositive({ message: 'La versión de cuotas debe ser mayor a 0' })
  cuotasVersion: number;

  @IsNotEmpty({ message: 'La clave de idempotencia es obligatoria' })
  @IsString({ message: 'La clave de idempotencia debe ser texto' })
  idempotencyKey: string; // Generado en el frontend
}
