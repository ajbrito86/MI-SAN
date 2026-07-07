import { Module } from '@nestjs/common';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [NotificacionesModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
