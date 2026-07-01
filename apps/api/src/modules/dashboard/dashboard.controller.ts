import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  resumen(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.dashboardService.resumen(usuario.id);
  }
}
