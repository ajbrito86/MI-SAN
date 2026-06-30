import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ParticipantesController } from './participantes.controller';
import { ParticipantesRepository } from './participantes.repository';
import { ParticipantesService } from './participantes.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ParticipantesController],
  providers: [ParticipantesService, ParticipantesRepository],
})
export class ParticipantesModule {}
