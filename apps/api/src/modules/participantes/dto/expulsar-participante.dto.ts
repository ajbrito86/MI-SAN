import { IsNotEmpty, IsString } from 'class-validator';

export class ExpulsarParticipanteDto {
  @IsString({ message: 'El motivo es obligatorio.' })
  @IsNotEmpty({ message: 'Debes indicar el motivo de expulsion.' })
  motivo!: string;
}
