import { PlataformaCompra } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ComprarPremiumDto {
  @IsOptional()
  @IsEnum(PlataformaCompra)
  plataformaCompra?: PlataformaCompra;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaccionExternaId?: string;
}
