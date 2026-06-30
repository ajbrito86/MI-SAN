import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { HistorialService } from './historial.service';

@UseGuards(JwtAuthGuard)
@Controller('societies/:id/history')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string) {
    return this.historialService.listar(usuario.id, sociedadId);
  }
}
