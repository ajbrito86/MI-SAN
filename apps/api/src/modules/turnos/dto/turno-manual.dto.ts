import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class TurnoManualDto {
  @IsString({ message: 'El participante es obligatorio.' })
  participanteId!: string;

  @Type(() => Number)
  @IsInt({ message: 'El numero de turno debe ser entero.' })
  @Min(1, { message: 'El numero de turno debe ser mayor que cero.' })
  numeroTurno!: number;
}
