import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { ReportesService } from './reportes.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('societies/:id/summary')
  resumenSociedad(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string) {
    return this.reportesService.resumenSociedad(usuario.id, sociedadId);
  }
}
