import { IsBoolean, IsOptional } from 'class-validator';

export class RegistrarEntregaDto {
  @IsOptional()
  @IsBoolean()
  permitirEntregaIncompleta?: boolean;
}
