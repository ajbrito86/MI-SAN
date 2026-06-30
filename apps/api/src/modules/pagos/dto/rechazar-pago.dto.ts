import { IsNotEmpty, IsString } from 'class-validator';

export class RechazarPagoDto {
  @IsString({ message: 'La observacion es obligatoria.' })
  @IsNotEmpty({ message: 'Debes indicar por que se rechaza el pago.' })
  observacion!: string;
}
