import { TipoPago } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReportarPagoDto {
  @IsString({ message: 'La cuota es obligatoria.' })
  cuotaPagoId!: string;

  @IsEnum(TipoPago, { message: 'Debes seleccionar un metodo de pago valido.' })
  metodoPago!: TipoPago;

  @IsOptional()
  @IsString({ message: 'La observacion debe ser texto.' })
  observacion?: string;
}
