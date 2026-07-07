import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { TurnosController } from './turnos.controller';
import { TurnosRepository } from './turnos.repository';
import { TurnosService } from './turnos.service';

@Module({
  imports: [JwtModule.register({}), NotificacionesModule],
  controllers: [TurnosController],
  providers: [TurnosService, TurnosRepository],
})
export class TurnosModule {}
