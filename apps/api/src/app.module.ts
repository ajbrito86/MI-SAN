import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnaliticasModule } from './modules/analiticas/analiticas.module';
import { validarEnv } from './config/validar-env';
import { AuthModule } from './modules/auth/auth.module';
import { ChatsModule } from './modules/chats/chats.module';
import { CiclosModule } from './modules/ciclos/ciclos.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ParticipantesModule } from './modules/participantes/participantes.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { HistorialModule } from './modules/historial/historial.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { LegalModule } from './modules/legal/legal.module';
import { SaludModule } from './modules/salud/salud.module';
import { SociedadesModule } from './modules/sociedades/sociedades.module';
import { SuscripcionesModule } from './modules/suscripciones/suscripciones.module';
import { TurnosModule } from './modules/turnos/turnos.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validarEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    SaludModule,
    LegalModule,
    ConfiguracionModule,
    AnaliticasModule,
    AuthModule,
    UsuariosModule,
    SuscripcionesModule,
    ChatsModule,
    SociedadesModule,
    ParticipantesModule,
    CiclosModule,
    DashboardModule,
    TurnosModule,
    PagosModule,
    UploadsModule,
    NotificacionesModule,
    HistorialModule,
    ReportesModule,
    JobsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
