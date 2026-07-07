import { IsOptional, IsString, MinLength } from 'class-validator';

export class EliminarCuentaDto {
  @IsString({ message: 'La contrasena actual es obligatoria.' })
  @IsOptional()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  contrasena?: string;
}
