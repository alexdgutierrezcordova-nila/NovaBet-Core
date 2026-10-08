import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateResultadoDto {
  @IsNotEmpty()
  @IsIn(['LOCAL', 'EMPATE', 'VISITANTE'])
  resultado: 'LOCAL' | 'EMPATE' | 'VISITANTE';

  @IsOptional()
  @IsString()
  marcadorFinal?: string;
}
