import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString({ message: 'Los nombres son obligatorios.' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios.' })
  nombres!: string;

  @IsString({ message: 'Los apellidos son obligatorios.' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  apellidos!: string;

  @IsString({ message: 'El telefono es obligatorio.' })
  @IsNotEmpty({ message: 'El telefono es obligatorio.' })
  telefono!: string;

  @IsEmail({}, { message: 'Debes indicar un correo valido.' })
  email!: string;

  @IsString({ message: 'La contrasena es obligatoria.' })
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  contrasena!: string;
}
