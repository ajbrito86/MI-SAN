import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CrearInvitacionDto {
  @ValidateIf((dto: CrearInvitacionDto) => !dto.emailInvitado)
  @IsString({ message: 'Debes indicar telefono o correo del invitado.' })
  telefonoInvitado?: string;

  @ValidateIf((dto: CrearInvitacionDto) => !dto.telefonoInvitado)
  @IsEmail({}, { message: 'Debes indicar un correo valido.' })
  emailInvitado?: string;

  @IsOptional()
  @IsString({ message: 'La observacion debe ser texto.' })
  observacion?: string;
}
