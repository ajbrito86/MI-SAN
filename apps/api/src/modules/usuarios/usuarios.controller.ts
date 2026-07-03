import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { EliminarCuentaDto } from './dto/eliminar-cuenta.dto';
import { UsuariosService } from './usuarios.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  obtenerPerfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.usuariosService.obtenerPerfil(usuario.id);
  }

  @Patch('me')
  actualizarPerfil(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: ActualizarPerfilDto) {
    return this.usuariosService.actualizarPerfil(usuario.id, dto);
  }

  @Delete('me')
  eliminarCuenta(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: EliminarCuentaDto) {
    return this.usuariosService.eliminarCuenta(usuario.id, dto);
  }
}
