import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateResultadoDto {
  @IsNotEmpty({ message: 'El resultado es obligatorio' })
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'], {
    message: 'El resultado debe ser LOCAL, EMPATE o VISITANTE',
  })
  resultado: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsOptional()
  @IsString()
  marcadorFinal?: string;
}
