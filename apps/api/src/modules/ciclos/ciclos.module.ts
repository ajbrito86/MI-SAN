import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CiclosController } from './ciclos.controller';
import { CiclosRepository } from './ciclos.repository';
import { CiclosService } from './ciclos.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CiclosController],
  providers: [CiclosService, CiclosRepository],
})
export class CiclosModule {}
