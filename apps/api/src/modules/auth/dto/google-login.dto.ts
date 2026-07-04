import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsString({ message: 'El token de Google es obligatorio.' })
  @IsNotEmpty({ message: 'El token de Google es obligatorio.' })
  idToken!: string;
}
