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

  @IsOptional()
  @IsString()
  @MaxLength(120)
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  purchaseToken?: string;

  @IsOptional()
  @IsString()
  transactionReceipt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  packageNameAndroid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalTransactionIdIos?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  appBundleIdIos?: string;

  @IsOptional()
  @IsString()
  jwsRepresentationIos?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  environmentIos?: string;
}
