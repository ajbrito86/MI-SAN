import { IsNotEmpty, IsString } from 'class-validator';

export class SolicitarRecuperacionDto {
  @IsString({ message: 'Debes indicar tu telefono o correo.' })
  @IsNotEmpty({ message: 'Debes indicar tu telefono o correo.' })
  identificador!: string;
}
