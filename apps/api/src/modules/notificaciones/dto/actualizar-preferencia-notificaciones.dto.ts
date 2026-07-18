import { IsBoolean } from 'class-validator';

export class ActualizarPreferenciaNotificacionesDto {
  @IsBoolean()
  habilitadas!: boolean;
}
