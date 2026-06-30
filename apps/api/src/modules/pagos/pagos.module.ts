import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JobsModule } from '../jobs/jobs.module';
import { PagosController } from './pagos.controller';
import { PagosRepository } from './pagos.repository';
import { PagosService } from './pagos.service';

@Module({
  imports: [JwtModule.register({}), JobsModule],
  controllers: [PagosController],
  providers: [PagosService, PagosRepository],
})
export class PagosModule {}
