import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EnviarMensajeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  mensaje!: string;
}
