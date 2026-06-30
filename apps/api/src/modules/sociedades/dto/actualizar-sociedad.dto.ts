import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FrecuenciaSociedad, ModalidadTurno, Moneda, TipoPago } from '@prisma/client';

export class ActualizarSociedadDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto.' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripcion debe ser texto.' })
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser numerico.' })
  @Min(1, { message: 'El monto debe ser mayor que cero.' })
  montoCuota?: number;

  @IsOptional()
  @IsEnum(Moneda, { message: 'Debe seleccionar una moneda valida.' })
  moneda?: Moneda;

  @IsOptional()
  @IsEnum(FrecuenciaSociedad, { message: 'Debe seleccionar una frecuencia valida.' })
  frecuencia?: FrecuenciaSociedad;

  @IsOptional()
  @IsEnum(ModalidadTurno, { message: 'Debe seleccionar una modalidad de turnos valida.' })
  modalidadTurnos?: ModalidadTurno;

  @IsOptional()
  @IsEnum(TipoPago, { message: 'Debe seleccionar un tipo de pago valido.' })
  tipoPago?: TipoPago;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad de participantes debe ser un numero entero.' })
  @Min(2, { message: 'Una sociedad debe tener al menos 2 participantes.' })
  cantidadParticipantes?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de inicio debe ser valida.' })
  fechaInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha estimada de fin debe ser valida.' })
  fechaFinEstimada?: Date;
}
