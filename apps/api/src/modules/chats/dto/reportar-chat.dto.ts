import { MotivoReporteChat } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class ReportarChatDto {
  @IsOptional()
  @IsString()
  mensajeId?: string;

  @IsEnum(MotivoReporteChat, { message: 'Debes seleccionar un motivo valido.' })
  motivo!: MotivoReporteChat;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ValidateIf((dto: ReportarChatDto) => dto.descripcion !== undefined)
  descripcion?: string;
}
