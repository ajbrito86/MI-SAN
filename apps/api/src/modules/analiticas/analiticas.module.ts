import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnaliticasController } from './analiticas.controller';
import { AnaliticasService } from './analiticas.service';

@Module({
  imports: [AuthModule],
  controllers: [AnaliticasController],
  providers: [AnaliticasService],
})
export class AnaliticasModule {}