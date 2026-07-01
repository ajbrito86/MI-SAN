import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JobsModule } from '../jobs/jobs.module';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [JwtModule.register({}), JobsModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
