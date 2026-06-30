import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FrecuenciaSociedad, ModalidadTurno, Moneda, TipoPago } from '@prisma/client';

export class CrearSociedadDto {
  @IsString({ message: 'El nombre es obligatorio.' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'La descripcion debe ser texto.' })
  descripcion?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser numerico.' })
  @Min(1, { message: 'El monto debe ser mayor que cero.' })
  montoCuota!: number;

  @IsEnum(Moneda, { message: 'Debe seleccionar una moneda valida.' })
  moneda!: Moneda;

  @IsEnum(FrecuenciaSociedad, { message: 'Debe seleccionar una frecuencia valida.' })
  frecuencia!: FrecuenciaSociedad;

  @IsEnum(ModalidadTurno, { message: 'Debe seleccionar una modalidad de turnos valida.' })
  modalidadTurnos!: ModalidadTurno;

  @IsEnum(TipoPago, { message: 'Debe seleccionar un tipo de pago valido.' })
  tipoPago!: TipoPago;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad de participantes debe ser un numero entero.' })
  @Min(2, { message: 'Una sociedad debe tener al menos 2 participantes.' })
  cantidadParticipantes!: number;

  @Type(() => Date)
  @IsDate({ message: 'La fecha de inicio debe ser valida.' })
  fechaInicio!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha estimada de fin debe ser valida.' })
  fechaFinEstimada?: Date;
}
