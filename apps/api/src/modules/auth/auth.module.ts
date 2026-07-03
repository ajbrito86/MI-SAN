import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SuscripcionesModule } from '../suscripciones/suscripciones.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule.register({}), SuscripcionesModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}