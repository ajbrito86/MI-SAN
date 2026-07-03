import { Module } from '@nestjs/common';
import { HealthController, SaludController } from './salud.controller';

@Module({
  controllers: [SaludController, HealthController],
})
export class SaludModule {}
