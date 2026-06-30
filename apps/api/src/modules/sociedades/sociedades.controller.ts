import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { ActualizarSociedadDto } from './dto/actualizar-sociedad.dto';
import { CrearSociedadDto } from './dto/crear-sociedad.dto';
import { SociedadesService } from './sociedades.service';

@UseGuards(JwtAuthGuard)
@Controller('societies')
export class SociedadesController {
  constructor(private readonly sociedadesService: SociedadesService) {}

  @Post()
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: CrearSociedadDto) {
    return this.sociedadesService.crear(usuario.id, dto);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.sociedadesService.listarDelUsuario(usuario.id);
  }

  @Get(':id')
  obtener(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string) {
    return this.sociedadesService.obtenerPorId(usuario.id, sociedadId);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') sociedadId: string,
    @Body() dto: ActualizarSociedadDto,
  ) {
    return this.sociedadesService.actualizar(usuario.id, sociedadId, dto);
  }

  @Post(':id/close')
  cerrar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string) {
    return this.sociedadesService.cerrar(usuario.id, sociedadId);
  }
}
