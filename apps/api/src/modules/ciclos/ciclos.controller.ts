import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioAutenticado } from '../../common/types/usuario-autenticado.type';
import { CiclosService } from './ciclos.service';
import { CrearCicloDto } from './dto/crear-ciclo.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CiclosController {
  constructor(private readonly ciclosService: CiclosService) {}

  @Post('societies/:id/cycles')
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') sociedadId: string, @Body() dto: CrearCicloDto) {
    return this.ciclosService.crear(usuario.id, sociedadId, dto);
  }

  @Post('cycles/:id/start')
  iniciar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') cicloId: string) {
    return this.ciclosService.iniciar(usuario.id, cicloId);
  }

  @Post('cycles/:id/finish')
  finalizar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') cicloId: string) {
    return this.ciclosService.finalizar(usuario.id, cicloId);
  }
}
