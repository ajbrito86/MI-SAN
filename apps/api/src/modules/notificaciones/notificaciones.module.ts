import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesRepository } from './notificaciones.repository';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [NotificacionesController],
  providers: [NotificacionesService, NotificacionesRepository],
})
export class NotificacionesModule {}
