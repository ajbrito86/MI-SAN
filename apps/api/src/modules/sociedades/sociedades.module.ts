import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SociedadesController } from './sociedades.controller';
import { SociedadesRepository } from './sociedades.repository';
import { SociedadesService } from './sociedades.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SociedadesController],
  providers: [SociedadesService, SociedadesRepository],
})
export class SociedadesModule {}
