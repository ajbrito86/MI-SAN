import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ConfirmarRecuperacionDto {
  @IsString({ message: 'Debes indicar tu telefono o correo.' })
  @IsNotEmpty({ message: 'Debes indicar tu telefono o correo.' })
  identificador!: string;

  @IsString({ message: 'El codigo es obligatorio.' })
  @Length(6, 6, { message: 'El codigo debe tener 6 digitos.' })
  codigo!: string;

  @IsString({ message: 'La nueva contrasena es obligatoria.' })
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  nuevaContrasena!: string;
}
