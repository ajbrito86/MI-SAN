import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Debes indicar tu telefono o correo.' })
  @IsNotEmpty({ message: 'Debes indicar tu telefono o correo.' })
  identificador!: string;

  @IsString({ message: 'La contrasena es obligatoria.' })
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  contrasena!: string;
}
