import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HistorialController } from './historial.controller';
import { HistorialRepository } from './historial.repository';
import { HistorialService } from './historial.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [HistorialController],
  providers: [HistorialService, HistorialRepository],
})
export class HistorialModule {}
