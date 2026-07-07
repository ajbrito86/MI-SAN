import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { RegistrarPushTokenDto } from './dto/registrar-push-token.dto';
import { NotificacionesService } from './notificaciones.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.notificacionesService.listar(usuario.id);
  }

  @Get('unread-count')
  contarNoLeidas(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.notificacionesService.contarNoLeidas(usuario.id);
  }

  @Patch('read-all')
  marcarTodasLeidas(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.notificacionesService.marcarTodasLeidas(usuario.id);
  }

  @Patch(':id/read')
  marcarLeida(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') notificacionId: string) {
    return this.notificacionesService.marcarLeida(usuario.id, notificacionId);
  }

  @Post('push-token')
  registrarPushToken(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: RegistrarPushTokenDto) {
    return this.notificacionesService.registrarPushToken(usuario.id, dto.pushToken);
  }

  @Delete('push-token')
  eliminarPushToken(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.notificacionesService.eliminarPushToken(usuario.id);
  }
}
