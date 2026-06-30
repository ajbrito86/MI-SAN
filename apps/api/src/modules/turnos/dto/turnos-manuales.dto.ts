import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { TurnoManualDto } from './turno-manual.dto';

export class TurnosManualesDto {
  @ArrayMinSize(2, { message: 'Debe indicar al menos 2 turnos.' })
  @ValidateNested({ each: true })
  @Type(() => TurnoManualDto)
  turnos!: TurnoManualDto[];
}
