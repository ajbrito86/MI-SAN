import { TipoEventoAnalitica } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegistrarEventoDto {
  @IsString({ message: 'El nombre del evento es obligatorio.' })
  @MaxLength(120)
  nombre!: string;

  @IsOptional()
  @IsEnum(TipoEventoAnalitica)
  tipo?: TipoEventoAnalitica;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  plataforma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  versionApp?: string;

  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}
