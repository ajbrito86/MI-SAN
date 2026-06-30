import { IsString } from 'class-validator';

export class SubirEvidenciaDto {
  @IsString({ message: 'La cuota es obligatoria.' })
  cuotaPagoId!: string;
}
