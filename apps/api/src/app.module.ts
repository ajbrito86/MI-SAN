import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validarEnv } from './config/validar-env';
import { AuthModule } from './modules/auth/auth.module';
import { ChatsModule } from './modules/chats/chats.module';
import { CiclosModule } from './modules/ciclos/ciclos.module';
import { ParticipantesModule } from './modules/participantes/participantes.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { HistorialModule } from './modules/historial/historial.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SaludModule } from './modules/salud/salud.module';
import { SociedadesModule } from './modules/sociedades/sociedades.module';
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
    PrismaModule,
    SaludModule,
    AuthModule,
    UsuariosModule,
    ChatsModule,
    SociedadesModule,
    ParticipantesModule,
    CiclosModule,
    TurnosModule,
    PagosModule,
    UploadsModule,
    NotificacionesModule,
    HistorialModule,
    ReportesModule,
    JobsModule,
  ],
})
export class AppModule {}
