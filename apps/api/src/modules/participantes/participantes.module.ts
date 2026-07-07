import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ParticipantesController } from './participantes.controller';
import { ParticipantesRepository } from './participantes.repository';
import { ParticipantesService } from './participantes.service';

@Module({
  imports: [JwtModule.register({}), NotificacionesModule],
  controllers: [ParticipantesController],
  providers: [ParticipantesService, ParticipantesRepository],
})
export class ParticipantesModule {}
