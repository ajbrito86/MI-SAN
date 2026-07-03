import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EliminarCuentaDto {
  @IsString({ message: 'La contrasena actual es obligatoria.' })
  @IsNotEmpty({ message: 'La contrasena actual es obligatoria.' })
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  contrasena!: string;
}
