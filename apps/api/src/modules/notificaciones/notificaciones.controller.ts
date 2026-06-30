import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { NotificacionesService } from './notificaciones.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.notificacionesService.listar(usuario.id);
  }

  @Patch(':id/read')
  marcarLeida(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') notificacionId: string) {
    return this.notificacionesService.marcarLeida(usuario.id, notificacionId);
  }
}
