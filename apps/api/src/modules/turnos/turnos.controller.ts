import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { RegistrarEntregaDto } from './dto/registrar-entrega.dto';
import { TurnosManualesDto } from './dto/turnos-manuales.dto';
import { TurnosService } from './turnos.service';

@UseGuards(JwtAuthGuard)
@Controller('cycles/:id/turns')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') cicloId: string) {
    return this.turnosService.listar(usuario.id, cicloId);
  }

  @Post('random')
  generarAleatorios(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') cicloId: string) {
    return this.turnosService.generarAleatorios(usuario.id, cicloId);
  }

  @Post('manual')
  generarManuales(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') cicloId: string,
    @Body() dto: TurnosManualesDto,
  ) {
    return this.turnosService.generarManuales(usuario.id, cicloId, dto);
  }

  @Post(':turnoId/deliver')
  registrarEntrega(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') cicloId: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: RegistrarEntregaDto,
  ) {
    return this.turnosService.registrarEntrega(usuario.id, cicloId, turnoId, dto);
  }
}
