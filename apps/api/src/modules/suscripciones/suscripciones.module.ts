import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { SuscripcionesController } from './suscripciones.controller';
import { SuscripcionesCronService } from './suscripciones-cron.service';
import { SuscripcionesService } from './suscripciones.service';

@Module({
  imports: [ConfiguracionModule, JwtModule.register({})],
  controllers: [SuscripcionesController],
  providers: [SuscripcionesService, SuscripcionesCronService],
  exports: [SuscripcionesService],
})
export class SuscripcionesModule {}