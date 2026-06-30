import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString({ message: 'Los nombres deben ser texto.' })
  nombres?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser texto.' })
  apellidos?: string;

  @IsOptional()
  @IsString({ message: 'El telefono debe ser texto.' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debes indicar un correo valido.' })
  email?: string;
}
