import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegistrarPushTokenDto {
  @IsString()
  @MaxLength(255)
  pushToken!: string;

  @IsOptional()
  @IsIn(['ios', 'android'])
  plataforma?: 'ios' | 'android';
}
