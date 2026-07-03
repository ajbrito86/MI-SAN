import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SuscripcionesModule } from '../suscripciones/suscripciones.module';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepository } from './usuarios.repository';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [JwtModule.register({}), SuscripcionesModule],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepository],
})
export class UsuariosModule {}
