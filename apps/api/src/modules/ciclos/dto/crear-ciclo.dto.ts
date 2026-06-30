import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class CrearCicloDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de inicio debe ser valida.' })
  fechaInicio?: Date;
}
